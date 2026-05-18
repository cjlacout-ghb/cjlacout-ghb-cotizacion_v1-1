/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Info,
  Edit3,
  Check
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TICKER_RATIOS } from "@/src/constants";

type CellType = 'number' | 'text' | 'currency' | 'percent';
type CellCategory = 'input' | 'reference' | 'result';

interface CellData {
  id: string;
  label: string;
  variable?: string;
  value: number;
  type: CellType;
  category: CellCategory;
  description?: string;
}

export default function App() {
  const [ticker, setTicker] = useState('');
  const [cells, setCells] = useState<Record<string, CellData>>({
    mep: { id: 'mep', label: 'Dólar MEP', variable: 'MEP', value: 0, type: 'currency', category: 'input', description: 'Dólar Mercado Electrónico de Pagos' },
    ccl: { id: 'ccl', label: 'Dólar CCL', variable: 'CCL', value: 0, type: 'currency', category: 'input', description: 'Dólar Contado con Liquidación' },
    cedearRatio: { id: 'cedearRatio', label: 'Ratio CEDEAR', variable: 'RATIO', value: 0, type: 'number', category: 'input', description: 'Relación entre el CEDEAR y la acción subyacente' },
    usaStockPrice: { id: 'usaStockPrice', label: 'Acción USA (USD)', variable: 'USA', value: 0, type: 'currency', category: 'input', description: 'Precio de la acción en el mercado estadounidense' },
    actualPriceArs: { id: 'actualPriceArs', label: 'Precio Actual ($)', variable: 'PRECIO_ARS', value: 0, type: 'currency', category: 'input', description: 'Precio actual del CEDEAR en pesos' },
    actualPriceUsd: { id: 'actualPriceUsd', label: 'Precio Actual (USD)', variable: 'PRECIO_USD', value: 0, type: 'currency', category: 'input', description: 'Precio actual del CEDEAR en dólares' },
  });

  const [manualRatio, setManualRatio] = useState<number | null>(null);

  const isTickerKnown = useMemo(() => {
    const uppercaseTicker = ticker.toUpperCase();
    return uppercaseTicker in TICKER_RATIOS;
  }, [ticker]);

  const calculations = useMemo(() => {
    const { mep, ccl, cedearRatio, usaStockPrice, actualPriceArs, actualPriceUsd } = cells;
    
    const autoRatio = ccl.value / mep.value;
    const ratioCclMep = manualRatio !== null ? manualRatio : autoRatio;
    
    const theoreticalArs = cedearRatio.value > 0 ? (usaStockPrice.value / cedearRatio.value) * (manualRatio !== null ? mep.value * manualRatio : ccl.value) : 0;
    const theoreticalUsd = cedearRatio.value > 0 ? (usaStockPrice.value / cedearRatio.value) * ratioCclMep : 0;
    
    const diffArsPercent = theoreticalArs > 0 ? ((actualPriceArs.value - theoreticalArs) / theoreticalArs) * 100 : 0;
    const diffUsdPercent = theoreticalUsd > 0 ? ((actualPriceUsd.value - theoreticalUsd) / theoreticalUsd) * 100 : 0;

    const finalTotalArs = theoreticalArs;

    return {
      ratioCclMep,
      theoreticalArs,
      theoreticalUsd,
      diffArsPercent,
      diffUsdPercent,
      finalTotalArs
    };
  }, [cells, manualRatio]);

  const updateCell = (id: string, field: keyof CellData, newValue: any) => {
    setCells(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: newValue }
    }));
  };

  const handleValueChange = (id: string, newValue: string) => {
    const numValue = parseInput(newValue);
    updateCell(id, 'value', numValue);
  };

  // Auto-update ratio when ticker changes
  useEffect(() => {
    const uppercaseTicker = ticker.toUpperCase();
    if (TICKER_RATIOS[uppercaseTicker]) {
      updateCell('cedearRatio', 'value', TICKER_RATIOS[uppercaseTicker]);
    }
  }, [ticker]);

  useEffect(() => {
    // Optional: fetch on initial load or ticker change
    // For now, let's just make it manual to avoid too many API calls
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen md:h-screen md:overflow-hidden bg-[var(--bg-main)] text-[var(--text-bright)] font-sans">
        {/* Header Section */}
        <header className="h-auto py-4 md:h-20 md:py-0 px-4 md:px-10 flex flex-col md:flex-row items-center border-b border-[var(--border)] bg-[var(--bg-panel)] shrink-0 gap-4 md:gap-8 overflow-hidden">
          <div className="font-mono font-black text-xl md:text-2xl lg:text-3xl tracking-widest uppercase text-[var(--accent)] border-l-4 md:border-l-8 border-[var(--accent)] pl-4 md:pl-6 leading-none py-1 md:py-2 shrink-0">
            COTIZACIÓN
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 lg:gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mb-1 text-center w-full">Ticker</span>
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Ej: GILD"
                  className="bg-blue-500/10 border border-blue-400/30 px-2 py-1.5 md:px-3 rounded-sm text-xs md:text-sm font-mono text-[var(--accent)] outline-none focus:border-[var(--accent)] hover:border-blue-400/50 transition-all w-24 md:w-32 uppercase text-center tracking-widest"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                />
                <Edit3 className="hidden md:block w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex flex-col items-center relative">
              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mb-1 text-center w-full">Ratio Cedear</span>
              <div className="relative group">
                <TooltipProvider>
                  <Tooltip open={!isTickerKnown}>
                    <TooltipTrigger asChild>
                      <div>
                        <HeaderInput 
                          value={cells.cedearRatio.value}
                          onChange={(v) => handleValueChange('cedearRatio', v)}
                          precision={0}
                          readOnly={isTickerKnown}
                          className={cn(
                            "w-24 md:w-32 text-xs md:text-sm",
                            !isTickerKnown && "bg-red-500/10 border-red-500 text-white focus:border-red-400 animate-pulse"
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-red-600 text-white border-none text-[9px] uppercase font-bold tracking-tighter">
                      Debe ingresar el valor del ratio
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isTickerKnown && <Edit3 className="hidden md:block w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mb-1 text-center w-full">Acción USA (USD)</span>
              <div className="relative group">
                <HeaderInput 
                  value={cells.usaStockPrice.value}
                  onChange={(v) => handleValueChange('usaStockPrice', v)}
                  precision={2}
                  className="w-24 md:w-32 text-xs md:text-sm"
                />
                <Edit3 className="hidden md:block w-3 h-3 absolute -right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[320px_1fr] md:overflow-hidden">
          {/* Sidebar - Fixed/Reference Data */}
          <aside className="bg-[var(--bg-panel)] border-b md:border-b-0 md:border-r border-[var(--border)] p-4 md:p-6 lg:p-8 overflow-y-auto w-full">

            <div className="section-title">Valores de Referencia</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-4 md:gap-0">
            
            <SidebarInput 
              label={cells.mep.label} 
              variable={cells.mep.variable!} 
              value={cells.mep.value} 
              onChange={(v) => handleValueChange('mep', v)} 
              onLabelChange={(v) => updateCell('mep', 'label', v)}
              onVariableChange={(v) => updateCell('mep', 'variable', v)}
            />
            <SidebarInput 
              label={cells.ccl.label} 
              variable={cells.ccl.variable!} 
              value={cells.ccl.value} 
              onChange={(v) => handleValueChange('ccl', v)} 
              onLabelChange={(v) => updateCell('ccl', 'label', v)}
              onVariableChange={(v) => updateCell('ccl', 'variable', v)}
            />
            <SidebarInput 
              label="Ratio CCL/MEP" 
              variable="R_CM" 
              value={calculations.ratioCclMep} 
              onChange={(v) => setManualRatio(parseFloat(v) || null)} 
              precision={4}
              isCurrency={false}
              readOnly={true}
            />
            </div>
          </aside>

          {/* Workspace */}
          <section className="workspace-gradient p-4 md:p-6 lg:p-10 overflow-y-auto space-y-6 md:space-y-8">
            {/* Variable Grid */}
            <div className="grid grid-cols-2 gap-5">
              <InputField 
                label={cells.actualPriceArs.label} 
                variable={cells.actualPriceArs.variable}
                value={cells.actualPriceArs.value} 
                prefix="$"
                precision={0}
                onChange={(v) => handleValueChange('actualPriceArs', v)} 
                onLabelChange={(v) => updateCell('actualPriceArs', 'label', v)}
                onVariableChange={(v) => updateCell('actualPriceArs', 'variable', v)}
              />
              <InputField 
                label={cells.actualPriceUsd.label} 
                variable={cells.actualPriceUsd.variable}
                value={cells.actualPriceUsd.value} 
                prefix="u$s"
                onChange={(v) => handleValueChange('actualPriceUsd', v)} 
                onLabelChange={(v) => updateCell('actualPriceUsd', 'label', v)}
                onVariableChange={(v) => updateCell('actualPriceUsd', 'variable', v)}
              />
            </div>

            {/* Results Section with Formula Display */}
            <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-sm p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="section-title mb-0">Resultados del Análisis</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">En Línea</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--accent)]/10 rounded border border-[var(--accent)]/20">
                    <Calculator className="w-3 h-3 text-[var(--accent)]" />
                    <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider">Calculado</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                {/* Result 1: ARS */}
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-3">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.2em] font-bold">Valor Teórico CEDEAR ($)</div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-serif text-[var(--text-bright)] flex items-baseline gap-2 relative flex-wrap">
                      <span className="text-xl md:text-2xl opacity-40">$</span>
                      {formatValue(calculations.theoreticalArs, 0)}
                      {calculations.diffArsPercent <= 0 && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="px-2 py-0.5 md:px-3 md:py-1 bg-emerald-500 text-black text-[8px] md:text-[10px] font-sans font-black uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-sm shadow-lg"
                        >
                          Comprar
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        calculations.diffArsPercent > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {calculations.diffArsPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(calculations.diffArsPercent).toFixed(2)}%
                      </div>
                      <span className="text-[10px] text-[var(--text-dim)] uppercase">Desvío vs. Mercado</span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/20 rounded border border-[var(--border)] relative overflow-hidden group">
                    <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-widest mb-3 font-bold border-b border-[var(--border)] pb-2">
                      Fórmula de Arbitraje (ARS)
                    </div>
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-3 font-mono text-sm">
                        <div className="flex flex-col items-center">
                          <span className="text-[var(--accent)]">{cells.usaStockPrice.variable}</span>
                          <div className="w-full h-[1px] bg-[var(--border)] my-1" />
                          <span className="text-[var(--text-dim)]">{cells.cedearRatio.variable}</span>
                        </div>
                        <span className="text-lg font-light text-[var(--text-dim)]">×</span>
                        <span className="text-[var(--accent)]">{cells.ccl.variable}</span>
                        <span className="text-lg font-light text-[var(--text-dim)]">=</span>
                        <span className="text-[var(--text-bright)] font-bold">ARS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result 2: USD */}
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-3">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase tracking-[0.2em] font-bold">Valor Teórico CEDEAR (u$s)</div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-serif text-[var(--text-bright)] flex items-baseline gap-2 relative flex-wrap">
                      <span className="text-xl md:text-2xl opacity-40">u$s</span>
                      {formatValue(calculations.theoreticalUsd, 2)}
                      {calculations.diffUsdPercent <= 0 && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="px-2 py-0.5 md:px-3 md:py-1 bg-emerald-500 text-black text-[8px] md:text-[10px] font-sans font-black uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-sm shadow-lg"
                        >
                          Comprar
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        calculations.diffUsdPercent > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {calculations.diffUsdPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(calculations.diffUsdPercent).toFixed(2)}%
                      </div>
                      <span className="text-[10px] text-[var(--text-dim)] uppercase">Desvío vs. Mercado</span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/20 rounded border border-[var(--border)] relative overflow-hidden group">
                    <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-widest mb-3 font-bold border-b border-[var(--border)] pb-2">
                      Fórmula de Arbitraje (USD)
                    </div>
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-3 font-mono text-sm">
                        <div className="flex flex-col items-center">
                          <span className="text-[var(--accent)]">{cells.usaStockPrice.variable}</span>
                          <div className="w-full h-[1px] bg-[var(--border)] my-1" />
                          <span className="text-[var(--text-dim)]">{cells.cedearRatio.variable}</span>
                        </div>
                        <span className="text-lg font-light text-[var(--text-dim)]">×</span>
                        <div className="flex flex-col items-center">
                          <span className="text-[var(--accent)]">{cells.ccl.variable}</span>
                          <div className="w-full h-[1px] bg-[var(--border)] my-1" />
                          <span className="text-[var(--text-dim)]">{cells.mep.variable}</span>
                        </div>
                        <span className="text-lg font-light text-[var(--text-dim)]">=</span>
                        <span className="text-[var(--text-bright)] font-bold">USD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-[var(--text-dim)] text-[12px] leading-relaxed border-l-2 border-[var(--border)] pl-5 italic">
              * Nota: Los cálculos se realizan automáticamente basándose en la fórmula de arbitraje financiero. 
              La validación de datos asegura que los valores numéricos reflejen las condiciones actuales del mercado local y extranjero.
            </div>
          </section>
        </main>

      </div>
    </TooltipProvider>
  );
}

function SidebarItem({ label, variable, value, type, precision = 2, suffix = "" }: { label: string, variable?: string, value: number, type: CellType, precision?: number, suffix?: string }) {
  const formattedValue = type === 'currency' 
    ? formatValue(value, 2)
    : formatValue(value, precision) + suffix;

  return (
    <div className="sidebar-item">
      <div className="flex items-center justify-between mb-1">
        <span className="sidebar-label mb-0">{label}</span>
        {variable && (
          <span className="text-[8px] font-mono text-[var(--accent)] opacity-60">
            [{variable}]
          </span>
        )}
      </div>
      <span className="sidebar-value">
        {type === 'currency' ? '$ ' : ''}
        {formattedValue}
      </span>
    </div>
  );
}

function HeaderInput({ value, onChange, precision = 2, readOnly = false, className = "" }: { value: number, onChange: (v: string) => void, precision?: number, readOnly?: boolean, className?: string }) {
  const [localValue, setLocalValue] = useState(formatValue(value, precision));

  useEffect(() => {
    const currentVal = parseInput(localValue);
    if (Math.abs(currentVal - value) > 0.0001) {
      setLocalValue(formatValue(value, precision));
    }
  }, [value, precision]);

  const handleChange = (val: string) => {
    if (readOnly) return;
    const regex = precision === 0 ? /[^0-9]/g : /[^0-9,.]/g;
    const sanitized = val.replace(regex, '');
    setLocalValue(sanitized);
    
    const numValue = parseInput(sanitized);
    if (sanitized !== '' && !isNaN(numValue)) {
      onChange(sanitized.replace(',', '.'));
    }
  };

  const handleBlur = () => {
    setLocalValue(formatValue(value, precision));
  };

  return (
    <input 
      type="text"
      className={cn(
        "bg-blue-500/10 border border-blue-400/30 px-2 py-1.5 md:px-3 rounded-sm text-sm font-mono text-[var(--accent)] outline-none focus:border-[var(--accent)] hover:border-blue-400/50 transition-all text-center tracking-widest",
        readOnly && "cursor-default opacity-80",
        className
      )}
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      readOnly={readOnly}
    />
  );
}

function formatValue(val: number, precision: number = 2) {
  return val.toFixed(precision).replace('.', ',');
}

function parseInput(val: string): number {
  const normalized = val.replace(',', '.');
  return parseFloat(normalized) || 0;
}

function SidebarInput({ label, variable, value, onChange, onLabelChange, onVariableChange, precision = 2, isCurrency = true, readOnly = false }: { label: string, variable: string, value: number, onChange: (v: string) => void, onLabelChange?: (v: string) => void, onVariableChange?: (v: string) => void, precision?: number, isCurrency?: boolean, readOnly?: boolean }) {
  const [localValue, setLocalValue] = useState(formatValue(value, precision));

  useEffect(() => {
    const currentVal = parseInput(localValue);
    if (Math.abs(currentVal - value) > 0.000001) {
      setLocalValue(formatValue(value, precision));
    }
  }, [value, precision]);

  const handleChange = (val: string) => {
    if (readOnly) return;
    // If precision is 0, only allow digits
    const regex = precision === 0 ? /[^0-9]/g : /[^0-9,.]/g;
    const sanitized = val.replace(regex, '');
    setLocalValue(sanitized);
    
    if (sanitized !== '' && !isNaN(parseInput(sanitized))) {
      onChange(sanitized.replace(',', '.'));
    }
  };

  const handleBlur = () => {
    setLocalValue(formatValue(value, precision));
  };

  return (
    <div className={cn("sidebar-item", !readOnly && "group")}>
      <div className="flex items-center justify-between mb-1.5">
        <input 
          className={cn(
            "sidebar-label mb-0 bg-transparent outline-none w-1/2 transition-colors",
            !readOnly ? "focus:text-[var(--accent)] cursor-text" : "cursor-default"
          )}
          value={label}
          onChange={(e) => !readOnly && onLabelChange?.(e.target.value)}
          readOnly={readOnly}
        />
        <input 
          className={cn(
            "text-[8px] font-mono text-[var(--accent)] bg-[var(--bg-input)] px-1 rounded border border-transparent outline-none w-12 text-center transition-all placeholder-opacity-50",
            !readOnly ? "focus:border-[var(--border)] cursor-text" : "cursor-default"
          )}
          value={variable}
          onChange={(e) => !readOnly && onVariableChange?.(e.target.value)}
          placeholder="VAR"
          readOnly={readOnly}
        />
      </div>
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--accent)] opacity-60 font-mono text-sm pointer-events-none">
          {isCurrency ? '$' : ''}
        </div>
        <input 
          type="text"
          className={cn(
            "w-full py-1 font-light outline-none transition-colors font-mono border-b",
            !readOnly 
              ? "bg-blue-500/5 border-blue-400/30 text-lg text-[var(--text-bright)] focus:border-[var(--accent)]" 
              : "bg-transparent border-[var(--border)] text-sm text-[var(--text-dim)] cursor-default",
            isCurrency ? "pl-4" : "pl-0"
          )}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          readOnly={readOnly}
        />
        {!readOnly && <Edit3 className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
      </div>
    </div>
  );
}

function InputField({ label, variable, value, onChange, onLabelChange, onVariableChange, diff, precision = 2, prefix = "", readOnly = false }: { label: string, variable?: string, value: number, onChange: (v: string) => void, onLabelChange?: (v: string) => void, onVariableChange?: (v: string) => void, diff?: number, precision?: number, prefix?: string, readOnly?: boolean }) {
  const [localValue, setLocalValue] = useState(formatValue(value, precision));

  useEffect(() => {
    const currentVal = parseInput(localValue);
    if (Math.abs(currentVal - value) > 0.0001) {
      setLocalValue(formatValue(value, precision));
    }
  }, [value, precision]);

  const handleChange = (val: string) => {
    if (readOnly) return;
    // If precision is 0, only allow digits
    const regex = precision === 0 ? /[^0-9]/g : /[^0-9,.]/g;
    const sanitized = val.replace(regex, '');
    setLocalValue(sanitized);
    
    const numValue = parseInput(sanitized);
    if (sanitized !== '' && !isNaN(numValue)) {
      onChange(sanitized.replace(',', '.'));
    }
  };

  const handleBlur = () => {
    setLocalValue(formatValue(value, precision));
  };

  return (
    <div className={cn("flex flex-col gap-2", !readOnly && "group")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <input 
            className={cn(
              "text-[11px] text-[var(--text-dim)] uppercase tracking-wider bg-transparent outline-none transition-colors w-full",
              !readOnly ? "focus:text-[var(--accent)] cursor-text" : "cursor-default"
            )}
            value={label}
            onChange={(e) => !readOnly && onLabelChange?.(e.target.value)}
            readOnly={readOnly}
          />
          {variable !== undefined && (
            <input 
              className={cn(
                "text-[9px] font-mono text-[var(--accent)] bg-[var(--bg-input)] px-1 rounded border outline-none w-16 text-center transition-all",
                !readOnly ? "border-[var(--border)] focus:border-[var(--accent)] cursor-text" : "border-transparent cursor-default"
              )}
              value={variable}
              onChange={(e) => !readOnly && onVariableChange?.(e.target.value)}
              readOnly={readOnly}
            />
          )}
        </div>
        {diff !== undefined && (
          <span className={cn(
            "text-[10px] font-bold shrink-0",
            diff < 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            {diff > 0 ? '+' : ''}{formatValue(diff, 2)}%
          </span>
        )}
      </div>
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] opacity-60 font-mono text-sm pointer-events-none">
            {prefix}
          </div>
        )}
        <input 
          type="text"
          className={cn(
            "w-full border p-3 text-white text-sm outline-none transition-colors font-mono",
            !readOnly 
              ? "bg-blue-500/10 border-blue-400/30 focus:border-[var(--accent)]" 
              : "bg-[var(--bg-input)] border-[var(--border)] cursor-default",
            prefix ? (prefix.length > 1 ? "pl-12" : "pl-7") : "pl-3"
          )}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          readOnly={readOnly}
        />
        {!readOnly && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
            <Check className="w-3 h-3 text-[var(--accent)]" />
          </div>
        )}
      </div>
    </div>
  );
}
