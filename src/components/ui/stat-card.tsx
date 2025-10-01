
"use client";

import { Card, CardContent } from "@/components/ui/card";
import * as React from 'react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon?: React.ElementType }) => (
    <Card>
        <CardContent className="flex items-center justify-between p-4">
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('bn-BD') : value}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100">
                {Icon && <Icon className="h-6 w-6 text-gray-600" />}
            </div>
        </CardContent>
    </Card>
);

export default StatCard;
