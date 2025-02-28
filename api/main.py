from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Union
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import time
from functools import lru_cache
import aiohttp
import asyncio
from urllib.parse import quote
import logging
import backoff

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="DCA AI Strategy API")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DefiLlama API endpoints
DEFILLAMA_API_BASE = "https://api.llama.fi"
DEFILLAMA_COINS_API = "https://coins.llama.fi"

# 支持的资产列表
SUPPORTED_ASSETS = {
    "BTC": "coingecko:bitcoin",
    "ETH": "coingecko:ethereum",
    "SOL": "coingecko:solana",
    "BNB": "coingecko:binancecoin"
}

# 重试装饰器
@backoff.on_exception(
    backoff.expo,
    (aiohttp.ClientError, asyncio.TimeoutError),
    max_tries=3,
    max_time=30
)
async def fetch_with_retry(session: aiohttp.ClientSession, url: str) -> Dict:
    """带重试机制的HTTP请求"""
    try:
        async with session.get(url, timeout=10) as response:
            if response.status != 200:
                logger.error(f"API request failed: {url} - Status: {response.status}")
                text = await response.text()
                logger.error(f"Response: {text}")
                raise HTTPException(
                    status_code=response.status,
                    detail=f"API request failed: {text}"
                )
            return await response.json()
    except asyncio.TimeoutError:
        logger.error(f"Request timeout: {url}")
        raise
    except Exception as e:
        logger.error(f"Request failed: {url} - Error: {str(e)}")
        raise

async def get_token_price(token_id: str) -> Dict[str, Union[float, str]]:
    """从DefiLlama获取代币价格"""
    logger.info(f"Fetching price for token: {token_id}")
    async with aiohttp.ClientSession() as session:
        try:
            url = f"{DEFILLAMA_COINS_API}/prices/current/{token_id}"
            data = await fetch_with_retry(session, url)
            
            if not data or "coins" not in data or token_id not in data["coins"]:
                logger.error(f"No price data found for {token_id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Price data not found for {token_id}"
                )
            
            price_data = data["coins"][token_id]
            logger.info(f"Successfully fetched price for {token_id}: {price_data['price']}")
            return {
                "price": price_data["price"],
                "timestamp": price_data["timestamp"],
                "symbol": price_data.get("symbol", token_id.split(":")[-1].upper()),
                "confidence": price_data.get("confidence", 0.99)
            }
        except Exception as e:
            logger.error(f"Failed to fetch price for {token_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch price: {str(e)}"
            )

async def get_token_chart(token_id: str, days: int = 30) -> List[Dict]:
    """从DefiLlama获取代币历史价格数据"""
    logger.info(f"Fetching chart data for token: {token_id}, days: {days}")
    async with aiohttp.ClientSession() as session:
        try:
            encoded_token_id = quote(token_id)
            url = f"{DEFILLAMA_API_BASE}/charts/prices?coins={encoded_token_id}&start={(int(time.time()) - days * 86400)}&span={days}d"
            data = await fetch_with_retry(session, url)
            
            if not data or token_id not in data:
                logger.warning(f"No chart data found for {token_id}")
                return []
            
            logger.info(f"Successfully fetched chart data for {token_id}")
            return data[token_id]
        except Exception as e:
            logger.error(f"Failed to fetch chart data for {token_id}: {str(e)}")
            return []

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
    logger.info("Fetching assets data")
    result = []
    errors = []
    
    for symbol, token_id in SUPPORTED_ASSETS.items():
        try:
            # 获取当前价格
            price_data = await get_token_price(token_id)
            
            # 获取24小时历史数据计算涨跌幅
            history = await get_token_chart(token_id, days=2)
            
            current_price = price_data["price"]
            change_24h = 0
            
            if len(history) >= 2:
                prev_price = history[0]["price"]
                change_24h = ((current_price - prev_price) / prev_price) * 100
            
            result.append(Asset(
                symbol=f"{symbol}-USD",
                name=symbol,
                current_price=current_price,
                change_24h=change_24h,
                volume_24h=0
            ))
        except Exception as e:
            error_msg = f"Error fetching data for {symbol}: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            continue
    
    if not result:
        error_details = "\n".join(errors)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch data for any supported assets:\n{error_details}"
        )
    
    return result

@app.get("/assets/{symbol}/chart", response_model=List[ChartData])
async def get_chart_data(symbol: str, range: str = "1M"):
    """获取资产的图表数据"""
    try:
        # 移除 -USD 后缀并获取对应的token_id
        base_symbol = symbol.replace("-USD", "")
        token_id = SUPPORTED_ASSETS.get(base_symbol)
        if not token_id:
            raise HTTPException(status_code=400, detail="Unsupported symbol")
            
        # 根据时间范围获取数据
        days_map = {
            "1D": 1,
            "1W": 7,
            "1M": 30,
            "3M": 90,
            "1Y": 365
        }
        days = days_map.get(range, 30)
        
        history = await get_token_chart(token_id, days)
        
        # 转换数据格式
        df = pd.DataFrame(history)
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
        df.set_index('timestamp', inplace=True)
        
        # 计算移动平均线
        df['SMA50'] = df['price'].rolling(window=50).mean()
        df['SMA200'] = df['price'].rolling(window=200).mean()
        
        result = []
        for index, row in df.iterrows():
            result.append(ChartData(
                date=index.strftime('%Y-%m-%d'),
                price=row['price'],
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
        # 获取基础代币符号
        base_symbol = strategy.asset.replace("-USD", "")
        token_id = SUPPORTED_ASSETS.get(base_symbol)
        if not token_id:
            raise HTTPException(status_code=400, detail="Unsupported asset")
        
        # 获取历史数据
        history = await get_token_chart(token_id, days=365)
        df = pd.DataFrame(history)
        
        # 计算基本指标
        current_price = df['price'].iloc[-1]
        sma_50 = df['price'].rolling(window=50).mean().iloc[-1]
        sma_200 = df['price'].rolling(window=200).mean().iloc[-1]
        volatility = df['price'].pct_change().std() * np.sqrt(252)
        
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
        volatility_adjustment = 1 + (0.5 - volatility)
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

@app.get("/token/price/{token_id}")
async def get_token_price_endpoint(token_id: str):
    """获取代币价格的API端点"""
    return await get_token_price(token_id) 