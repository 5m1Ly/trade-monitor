'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

export default function SellTradeDialog({
    open,
    onOpenChange,
    onSubmit,
    trade,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (sellDate: string, sellPrice: string) => void;
    trade: { id: string; symbol: string; amount: number } | null;
}) {
    const [sellDate, setSellDate] = useState<string>(
        new Date().toISOString().slice(0, 10)
    );
    const [sellPrice, setSellPrice] = useState<string>('');

    const handleSubmit = () => {
        if (!sellDate || !sellPrice) {
            alert('Please fill in both date and price');
            return;
        }
        onSubmit(sellDate, sellPrice);
        setSellDate(new Date().toISOString().slice(0, 10));
        setSellPrice('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mark Trade as Sold</DialogTitle>
                    <DialogDescription>
                        Enter the date and price at which you sold{' '}
                        <code className="font-semibold">{trade?.symbol}</code>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="sell-date">Sell Date</Label>
                        <Input
                            id="sell-date"
                            type="date"
                            value={sellDate}
                            onChange={(e) => setSellDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="sell-price">Sell Price per Unit</Label>
                        <Input
                            id="sell-price"
                            type="number"
                            placeholder="0.00000"
                            step="0.00000001"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Mark as Sold</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
