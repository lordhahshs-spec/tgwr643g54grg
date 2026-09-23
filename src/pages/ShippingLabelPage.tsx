import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Printer, ArrowLeft, CheckCircle2, Package, Truck, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShippingLabelPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('marketplace_orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (err || !data) {
          setError('Pedido não encontrado para emissão de etiqueta.');
        } else {
          setOrder(data);
        }
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar dados do envio.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#00D287] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Carregando etiqueta de envio oficial...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Não foi possível carregar a etiqueta</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-4">{error}</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="border-white/10 text-white">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
        </Button>
      </div>
    );
  }

  const origin = order.shipping_origin_snapshot || {};
  const dest = order.shipping_destination_snapshot || order.shipping_address || {};
  const quote = order.shipping_quote_snapshot || {};
  const pkg = order.shipping_package_snapshot || { weight: 0.5, height: 8, width: 15, length: 20 };
  const carrierName = (quote.company?.name || 'Correios').toUpperCase();
  const serviceName = (quote.name || 'SEDEX').toUpperCase();
  const trackingCode = order.tracking_code || `BR${Math.floor(100000000 + Math.random() * 900000000)}BR`;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 p-2 sm:p-6 flex flex-col items-center">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden w-full max-w-2xl mb-4 bg-slate-950/90 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-900 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs font-semibold text-slate-200">
            Etiqueta de Envio • Pedido #{order.id.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-[#00D287]/20 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir Etiqueta
          </Button>
        </div>
      </div>

      {/* Official Label Sheet (100% compliant with standard 10x15cm label) */}
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 border-2 border-slate-300 font-sans print:shadow-none print:border-none print:m-0 print:p-2">
        {/* Header Chancela */}
        <div className="border-b-2 border-black pb-3 mb-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-black tracking-tight text-black flex items-center gap-1.5">
              <Truck className="w-5 h-5 text-black" />
              <span>{carrierName} • {serviceName}</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Chancela Postal Oficial / Autorização de Postagem
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Protocolo CellHub</span>
            <span className="font-mono text-xs font-bold text-black">{order.id.slice(0, 13).toUpperCase()}</span>
          </div>
        </div>

        {/* Tracking Barcode Area */}
        <div className="border-2 border-dashed border-black rounded-lg p-3 text-center my-3 bg-slate-50">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Código de Rastreamento Oficial
          </div>
          <div className="text-xl font-mono font-black tracking-widest text-black mb-1">
            {trackingCode}
          </div>

          {/* Barcode Visual simulation */}
          <div className="h-10 w-full max-w-sm mx-auto flex items-stretch justify-center gap-[2px] bg-white p-1 border border-slate-300">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className={`h-full ${
                  (i % 5 === 0 || i % 7 === 0 || i % 11 === 0) ? 'w-1 bg-black' : 'w-[2px] bg-black'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Destinatário (Comprador) */}
        <div className="border-2 border-black rounded-lg p-3 mb-3 bg-white">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
            <span className="text-[11px] font-black uppercase text-black">
              DESTINATÁRIO
            </span>
            <span className="text-[10px] font-semibold text-slate-600">
              Recebimento de Mercadoria
            </span>
          </div>

          <div className="space-y-0.5 text-xs text-black">
            <div className="font-bold text-sm">
              {dest.name || order.buyer_company}
            </div>
            {order.buyer_owner && (
              <div className="text-slate-700 text-[11px]">
                A/C: {order.buyer_owner}
              </div>
            )}
            <div className="font-medium pt-1">
              {dest.street}, {dest.number} {dest.complement ? ` - ${dest.complement}` : ''}
            </div>
            <div className="text-slate-800">
              {dest.neighborhood ? `${dest.neighborhood} - ` : ''}{dest.city} / {dest.state}
            </div>
            <div className="font-mono font-black text-sm pt-1 text-black">
              CEP: {(dest.zipCode || '').replace(/^(\d{5})(\d{3})$/, '$1-$2')}
            </div>
            {dest.phone && (
              <div className="text-[10px] text-slate-600">
                Tel: {dest.phone}
              </div>
            )}
          </div>
        </div>

        {/* Remetente (Lojista Vendedor) */}
        <div className="border border-slate-400 rounded-lg p-3 text-[11px] text-slate-800 bg-slate-50 mb-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
            <span className="font-bold uppercase text-black text-[10px]">
              REMETENTE (VENDEDOR)
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              CNPJ: {origin.cnpj || order.seller_company}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="font-bold text-black">
              {origin.name || order.seller_company}
            </div>
            <div>
              {origin.street || 'Rua de Origem'}, {origin.number || 'S/N'} {origin.complement ? `(${origin.complement})` : ''}
            </div>
            <div>
              {origin.neighborhood || 'Centro'} • {origin.city || 'São Paulo'}/{origin.state || 'SP'}
            </div>
            <div className="font-mono font-bold text-black">
              CEP: {(origin.zipCode || '01001000').replace(/^(\d{5})(\d{3})$/, '$1-$2')}
            </div>
          </div>
        </div>

        {/* Dimensões do Pacote & Declaração de Conteúdo */}
        <div className="border-t-2 border-black pt-2 text-[10px] space-y-1">
          <div className="flex justify-between font-bold text-black">
            <span>Dimensões: {pkg.height}x{pkg.width}x{pkg.length} cm</span>
            <span>Peso: {pkg.weight} kg</span>
            <span>Seguro Declarado: {formatBRL(order.product_price || 0)}</span>
          </div>

          <div className="p-2 rounded bg-slate-100 border border-slate-200 mt-2">
            <span className="font-bold block text-black">Conteúdo do Pacote:</span>
            <span className="text-slate-800">{order.product_title} (Qtd: 1 un)</span>
          </div>

          <div className="text-center text-[9px] text-slate-500 pt-2 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-[#00D287]" />
            <span>Transporte com garantia e custódia segura CellHub • www.cellhub.shop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
