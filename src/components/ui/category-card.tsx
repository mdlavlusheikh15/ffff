
"use client";

import { Card, CardContent } from "@/components/ui/card";
import * as React from 'react';

const CategoryCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon?: React.ElementType }) => (
    <Card className="flex flex-col items-center justify-center p-4 text-center">
        {Icon && <Icon className="h-8 w-8 text-gray-500 mb-2" />}
        <p className="text-xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
    </Card>
)

export default CategoryCard;
