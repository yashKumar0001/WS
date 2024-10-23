import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

// Utility to convert WebSocket candlestick data to chart format
const convertToChartData = (data) => {
    return {
        labels: data.map(d => new Date(d[0]).toLocaleTimeString()), // Use the open time as labels
        datasets: [
            {
                label: 'Price (USDT)',
                data: data.map(d => d[4]), // Use the closing price
                backgroundColor: 'rgba(75,192,192,0.4)',
                borderColor: 'rgba(75,192,192,1)',
                fill: false,
            },
        ],
    };
};

const BinanceChart = () => {
    const [symbol, setSymbol] = useState('ethusdt');
    const [interval, setInterval] = useState('1m');
    const [chartData, setChartData] = useState([]);
    const [savedData, setSavedData] = useState({});
    const ws = useRef(null);

    // Fetch and store saved data in localStorage when component loads
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('candlestickData') || '{}');
        setSavedData(saved);
    }, []);

    // WebSocket connection
    useEffect(() => {
        if (ws.current) ws.current.close(); // Close existing WebSocket before opening a new one
        ws.current = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const kline = message.k;
            const newCandle = [kline.t, kline.o, kline.h, kline.l, kline.c, kline.v];
            setChartData((prevData) => {
                const updatedData = [...prevData, newCandle].slice(-100);
                const storedData = { ...savedData, [symbol]: updatedData };
                setSavedData(storedData);
                localStorage.setItem('candlestickData', JSON.stringify(storedData));
                return updatedData;
            });
        };

        return () => {
            ws.current.close(); // Clean up WebSocket on component unmount
        };
    }, [symbol, interval]);

    // Restore saved data from localStorage on symbol change
    useEffect(() => {
        const savedSymbolData = savedData[symbol] || [];
        setChartData(savedSymbolData);
    }, [symbol, savedData]);

    // const options = {
    //     scales: {
    //         y: {
    //             ticks: {
    //                 stepSize: 5, 
    //             },
    //         },
    //     },
    // };

    return (
        <div>
            <h2>{symbol.toUpperCase()} Chart</h2>

            {/* Coin Toggle */}
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                <option value="ethusdt">ETH/USDT</option>
                <option value="bnbusdt">BNB/USDT</option>
                <option value="dotusdt">DOT/USDT</option>
            </select>

            {/* Interval Toggle */}
            <select value={interval} onChange={(e) => setInterval(e.target.value)}>
                <option value="1m">1 Minute</option>
                <option value="3m">3 Minutes</option>
                <option value="5m">5 Minutes</option>
            </select>

            {/* Chart Display */}
            <div className='chartDisplay'>
            <Line data={convertToChartData(chartData)} 
            // options={options} 
            />
            
            </div>
        </div>
    );
};

export default BinanceChart;
