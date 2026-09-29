import React, { useMemo, useState } from 'react';
import { CandlePoint, ChartType, Currency } from '../types/crypto';
import { formatCompactNumber, formatPrice } from '../utils/formatters';

interface InteractiveChartProps {
  data: CandlePoint[];
  chartType: ChartType;
  currency: Currency;
  isPositive: boolean;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  chartType,
  currency,
  isPositive,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { minPrice, maxPrice, range, highVolume } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minPrice: 0, maxPrice: 1, range: 1, highVolume: 1 };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    data.forEach((p) => {
      if (p.low < min) min = p.low;
      if (p.high > max) max = p.high;
      if (p.volume > maxVol) maxVol = p.volume;
    });

    // Add 2% padding on top and bottom for visual breathing room
    const padding = (max - min) * 0.05 || 0.01;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      range: (max + padding) - (min - padding) || 1,
      highVolume: maxVol || 1,
    };
  }, [data]);

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  const svgWidth = 800;
  const svgHeight = 340;
  const chartHeight = 260;
  const volumeHeight = 60;
  const volumeTop = 270;

  // Coordinate mapper
  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / range) * chartHeight;
  };

  const getX = (idx: number) => {
    if (data.length <= 1) return 0;
    return (idx / (data.length - 1)) * svgWidth;
  };

  // Build line path
  const linePath = useMemo(() => {
    if (!data || data.length === 0) return '';
    return data.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.close);
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }, '');
  }, [data, minPrice, range]);

  const areaPath = `${linePath} L ${svgWidth},${chartHeight} L 0,${chartHeight} Z`;

  const primaryColor = isPositive ? '#0ECB81' : '#F6465D';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="w-full select-none">
      {/* Active candle / hover detail header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3 bg-[#14151A] px-3 py-2 rounded-xl border border-[#2B313A]">
        <div className="flex items-center gap-3">
          <span className="text-[#848E9C] font-mono-num">
            {activePoint ? activePoint.time : '--:--'}
          </span>
          {activePoint && (
            <div className="flex items-center gap-2 sm:gap-4 font-mono-num text-[11px] sm:text-xs">
              <span className="text-[#848E9C]">
                О: <strong className="text-[#EAECEF]">{formatPrice(activePoint.open, currency)}</strong>
              </span>
              <span className="text-[#848E9C]">
                М: <strong className="text-[#0ECB81]">{formatPrice(activePoint.high, currency)}</strong>
              </span>
              <span className="text-[#848E9C]">
                Мин: <strong className="text-[#F6465D]">{formatPrice(activePoint.low, currency)}</strong>
              </span>
              <span className="text-[#848E9C]">
                З: <strong className="text-white font-bold">{formatPrice(activePoint.close, currency)}</strong>
              </span>
            </div>
          )}
        </div>

        {activePoint && (
          <div className="text-[11px] font-mono-num text-[#848E9C]">
            Объем: <strong className="text-[#EAECEF]">{formatCompactNumber(activePoint.volume)}</strong>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[24/10] bg-[#0E1114] rounded-xl border border-[#2B313A] overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = chartHeight * ratio;
            return (
              <line
                key={ratio}
                x1={0}
                y1={y}
                x2={svgWidth}
                y2={y}
                stroke="#2B313A"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.6}
              />
            );
          })}

          {/* Volume separator line */}
          <line
            x1={0}
            y1={volumeTop - 5}
            x2={svgWidth}
            y2={volumeTop - 5}
            stroke="#2B313A"
            strokeWidth={1}
          />

          {/* Volume Bars */}
          {data.map((pt, idx) => {
            const x = getX(idx);
            const barWidth = Math.max(2, (svgWidth / data.length) * 0.65);
            const volHeight = Math.max(2, (pt.volume / highVolume) * volumeHeight);
            const y = svgHeight - volHeight;
            const isGreen = pt.close >= pt.open;

            return (
              <rect
                key={`vol-${idx}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={volHeight}
                fill={isGreen ? '#0ECB81' : '#F6465D'}
                opacity={0.35}
              />
            );
          })}

          {/* Render Candlesticks OR Area Line */}
          {chartType === 'candles' ? (
            data.map((candle, idx) => {
              const x = getX(idx);
              const isUp = candle.close >= candle.open;
              const color = isUp ? '#0ECB81' : '#F6465D';

              const highY = getY(candle.high);
              const lowY = getY(candle.low);
              const openY = getY(candle.open);
              const closeY = getY(candle.close);

              const topBodyY = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
              const candleWidth = Math.max(3, (svgWidth / data.length) * 0.68);

              return (
                <g key={`candle-${idx}`}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1.2}
                  />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={topBodyY}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx={1}
                  />
                </g>
              );
            })
          ) : (
            <>
              {/* Area fill */}
              <path d={areaPath} fill="url(#chartGradient)" />
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke={primaryColor}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Crosshair on hover */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoverIndex)}
                y1={0}
                x2={getX(hoverIndex)}
                y2={svgHeight}
                stroke="#F0B90B"
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              {/* Horizontal line on close price */}
              <line
                x1={0}
                y1={getY(data[hoverIndex].close)}
                x2={svgWidth}
                y2={getY(data[hoverIndex].close)}
                stroke="#F0B90B"
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              {/* Dot on price */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].close)}
                r={4.5}
                fill="#F0B90B"
                stroke="#0B0E11"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Max and Min price labels in corner */}
        <div className="absolute top-2 right-3 text-[10px] font-mono-num text-[#848E9C] bg-[#1E2329]/80 px-2 py-0.5 rounded border border-[#2B313A]">
          Макс: {formatPrice(maxPrice, currency)}
        </div>
        <div className="absolute bottom-16 right-3 text-[10px] font-mono-num text-[#848E9C] bg-[#1E2329]/80 px-2 py-0.5 rounded border border-[#2B313A]">
          Мин: {formatPrice(minPrice, currency)}
        </div>
      </div>
    </div>
  );
};
