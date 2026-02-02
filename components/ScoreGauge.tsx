
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  const getColor = (s: number) => {
    return '#e81c1c'; // Lightspeed Red
  };

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-full h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
              animationBegin={0}
              cornerRadius={12}
            >
              <Cell fill={getColor(score)} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-16">
          <span className="text-8xl font-black text-lightspeed-dark tracking-tighter leading-none mt-4">{score}</span>
          <span className="text-[12px] font-black text-neutral-400 uppercase tracking-[0.6em] mt-3">Score</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;
