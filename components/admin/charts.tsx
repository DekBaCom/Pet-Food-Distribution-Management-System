"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"];

export function AdminCharts() {
  const [data, setData] = useState<{
    daily: { date: string; count: number }[];
    byFood: { name: string; value: number }[];
    byType: { name: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/chart-data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ daily: [], byFood: [], byType: [] }));
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Registrations by day */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">ลงทะเบียนรายวัน</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="ลงทะเบียน" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Receiver type donut */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">ประเภทผู้รับ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.byType}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} คน`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Food distribution bar */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">อาหารที่แจกจ่าย (KG / ซอง)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byFood}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="จำนวน" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
