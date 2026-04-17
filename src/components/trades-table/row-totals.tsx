import type React from "react";
import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "../ui/table";
import { format } from "./utils";

export type TotalsRowProps = {
  label: "total" | string;
  active: boolean;
  currency: "EUR" | "USD";
  amount: number;
  expense: {
    eur?: number;
    usd?: number;
  };
  value: {
    eur?: number;
    usd?: number;
  };
  delta: {
    percent: number | null;
    nominal: number | null;
  };
};

export const TotalsRow = ({
  label,
  currency,
  amount,
  expense: exp,
  value: val,
  delta,
}: TotalsRowProps) => {
  const isSubtotal = label !== "total";

  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "~";

  const expense = format(
    currency === "EUR" && exp.eur
      ? exp.eur
      : currency === "USD" && exp.usd
        ? exp.usd
        : 0,
  );

  const value = format(
    currency === "EUR" && val.eur
      ? val.eur
      : currency === "USD" && val.usd
        ? val.usd
        : 0,
  );

  delta.percent ||= 0;
  delta.nominal ||= 0;

  const Row = ({ children }: React.PropsWithChildren) => (
    <TableRow
      className={cn(
        "border-t-2 border-b-2",
        isSubtotal && typeof delta.nominal === "number" && delta.nominal !== 0
          ? delta.nominal > 0
            ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-50"
            : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-50"
          : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-50",
      )}
    >
      {children}
    </TableRow>
  );

  const Cell = ({
    pos,
    children,
  }: React.PropsWithChildren<{ pos?: "center" | "right" }>) => (
    <TableCell
      className={cn(
        isSubtotal ? "font-semibold" : "font-bold",
        isSubtotal ? "text-[14px]" : "text-[16px]",
        pos !== "center"
          ? pos !== "right"
            ? ""
            : "text-right"
          : "text-center",
      )}
    >
      <code>{children}</code>
    </TableCell>
  );

  return (
    <Row>
      {/* date */}
      <Cell>{isSubtotal ? `sub total (${label})` : "total"}</Cell>

      {/* price */}
      <Cell />

      {/* amount */}
      <Cell pos="right">{format(amount)}</Cell>

      {/* cost */}
      <Cell pos="right">
        {expense} {symbol}
      </Cell>

      {/* value */}
      <Cell pos="right">
        {value} {symbol}
      </Cell>

      {/* pofit % */}
      <Cell pos="right">
        <span
          className={cn(
            delta.percent > 0 && "text-green-600 dark:text-green-500",
            delta.percent < 0 && "text-rose-600 dark:text-rose-500",
            delta.percent === 0 && "text-blue-600 dark:text-blue-500",
          )}
        >
          {format(delta.percent)} %
        </span>
      </Cell>

      {/* pofit $ */}
      <Cell pos="right">
        <span
          className={cn(
            delta.percent > 0 && "text-green-600 dark:text-green-500",
            delta.percent < 0 && "text-rose-600 dark:text-rose-500",
            delta.percent === 0 && "text-blue-600 dark:text-blue-500",
          )}
        >
          {format(delta.nominal)} {symbol}
        </span>
      </Cell>

      {/* actions */}
      <Cell />
    </Row>
  );
};
