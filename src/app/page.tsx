"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  Target,
} from "lucide-react";

const stats = [
  {
    title: "Spend",
    value: "$4,820",
    icon: DollarSign,
  },
  {
    title: "ROAS",
    value: "4.3x",
    icon: Target,
  },
  {
    title: "Clicks",
    value: "12,480",
    icon: MousePointerClick,
  },
  {
    title: "Purchases",
    value: "312",
    icon: ShoppingCart,
  },
];

const chartData = [
  { day: "Mon", spend: 400, revenue: 1200 },
  { day: "Tue", spend: 500, revenue: 1700 },
  { day: "Wed", spend: 650, revenue: 2100 },
  { day: "Thu", spend: 480, revenue: 1800 },
  { day: "Fri", spend: 720, revenue: 2600 },
  { day: "Sat", spend: 800, revenue: 3100 },
  { day: "Sun", spend: 690, revenue: 2800 },
];

const pieData = [
  { name: "Scaling", value: 55 },
  { name: "Testing", value: 30 },
  { name: "Paused", value: 15 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              Media Buying Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Live Meta Ads Performance Monitoring
            </p>
          </div>

          <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
            Updated Hourly
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">
                      {item.title}
                    </p>

                    <h2 className="text-3xl font-bold mt-2">
                      {item.value}
                    </h2>
                  </div>

                  <div className="bg-zinc-800 p-3 rounded-xl">
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

          <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-2xl font-bold mb-4">
              Spend vs Revenue
            </h2>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-2xl font-bold mb-4">
              Campaign Status
            </h2>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={120}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-2xl font-bold mb-4">
            Top Campaigns
          </h2>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />

                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}