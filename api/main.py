from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
import numpy as np

app = FastAPI(title="DCA AI Strategy API")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Asset(BaseModel):
    symbol: str
    name: str
    current_price: float
    change_24h: float
    volume_24h: float

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ChartData(BaseModel):
    date: str
    price: float
    sma50: float
    sma200: float

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DCAStrategy(BaseModel):
    asset: str
    amount: float
    frequency: str
    start_date: datetime
    end_date: Optional[datetime] = None
    ai_enhanced: bool = True

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DCARecommendation(BaseModel):
    asset: str
    optimal_entry_price: float
    sentiment: str
    confidence: float
    next_dca_date: datetime
    suggested_amount: float
    market_conditions: List[str]

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SavedStrategy(BaseModel):
    id: str
    created_at: datetime
    strategy: DCAStrategy
    recommendation: DCARecommendation

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

@app.get("/")
async def root():
    return {"message": "DCA AI Strategy API"}

@app.get("/assets", response_model=List[Asset])
async def get_assets():
    """获取支持的资产列表及其当前市场数据"""
    assets = ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD"]
    result = []
    
    for symbol in assets:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="2d")
            
            if len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                prev_price = hist['Close'].iloc[-2]
                change_24h = ((current_price - prev_price) / prev_price) * 100
                volume_24h = hist['Volume'].iloc[-1]
                
                result.append(Asset(
                    symbol=symbol,
                    name=info.get('name', symbol),
                    current_price=current_price,
                    change_24h=change_24h,
                    volume_24h=volume_24h
                ))
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            continue
    
    return result

@app.get("/assets/{symbol}/chart", response_model=List[ChartData])
async def get_chart_data(symbol: str, range: str = "1M"):
    """获取资产的图表数据"""
    try:
        # 根据时间范围获取数据
        periods = {
            "1D": "1d",
            "1W": "1wk",
            "1M": "1mo",
            "3M": "3mo",
            "1Y": "1y"
        }
        period = periods.get(range, "1mo")
        
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        # 计算移动平均线
        hist['SMA50'] = hist['Close'].rolling(window=50).mean()
        hist['SMA200'] = hist['Close'].rolling(window=200).mean()
        
        result = []
        for index, row in hist.iterrows():
            result.append(ChartData(
                date=index.strftime('%Y-%m-%d'),
                price=row['Close'],
                sma50=row['SMA50'] if not pd.isna(row['SMA50']) else 0,
                sma200=row['SMA200'] if not pd.isna(row['SMA200']) else 0
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dca/analyze", response_model=DCARecommendation)
async def analyze_dca_strategy(strategy: DCAStrategy):
    """分析 DCA 策略并提供 AI 增强建议"""
    try:
        # 获取历史数据
        ticker = yf.Ticker(strategy.asset)
        hist = ticker.history(period="1y")
        
        # 计算基本指标
        current_price = hist['Close'].iloc[-1]
        sma_50 = hist['Close'].rolling(window=50).mean().iloc[-1]
        sma_200 = hist['Close'].rolling(window=200).mean().iloc[-1]
        volatility = hist['Close'].pct_change().std() * np.sqrt(252)
        
        # 生成市场状况分析
        market_conditions = []
        if current_price > sma_50:
            market_conditions.append("价格高于50日均线")
        if current_price > sma_200:
            market_conditions.append("价格高于200日均线")
        if volatility > 0.5:
            market_conditions.append("市场波动性较高")
        
        # 计算建议的买入价格
        optimal_entry = current_price * 0.95  # 建议在5%的回调点买入
        
        # 确定市场情绪
        if current_price > sma_200 and current_price > sma_50:
            sentiment = "看涨"
            confidence = 0.8
        elif current_price < sma_200 and current_price < sma_50:
            sentiment = "看跌"
            confidence = 0.7
        else:
            sentiment = "中性"
            confidence = 0.5
        
        # 计算下次DCA日期
        frequency_days = {
            "daily": 1,
            "weekly": 7,
            "monthly": 30
        }
        next_dca_date = datetime.now() + timedelta(days=frequency_days[strategy.frequency])
        
        # 根据波动性调整建议金额
        volatility_adjustment = 1 + (0.5 - volatility) # 波动性越高，建议金额越低
        suggested_amount = strategy.amount * max(0.5, min(1.5, volatility_adjustment))
        
        return DCARecommendation(
            asset=strategy.asset,
            optimal_entry_price=optimal_entry,
            sentiment=sentiment,
            confidence=confidence,
            next_dca_date=next_dca_date,
            suggested_amount=suggested_amount,
            market_conditions=market_conditions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 存储策略的内存数据库
saved_strategies: List[SavedStrategy] = []

@app.post("/strategies", response_model=SavedStrategy)
async def save_strategy(strategy: DCAStrategy):
    """保存 DCA 策略"""
    try:
        # 分析策略
        recommendation = await analyze_dca_strategy(strategy)
        
        # 创建保存的策略
        saved_strategy = SavedStrategy(
            id=f"strategy_{len(saved_strategies) + 1}",
            created_at=datetime.now(),
            strategy=strategy,
            recommendation=recommendation
        )
        
        # 保存策略
        saved_strategies.append(saved_strategy)
        
        return saved_strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/strategies", response_model=List[SavedStrategy])
async def get_saved_strategies():
    """获取所有保存的策略"""
    return saved_strategies 