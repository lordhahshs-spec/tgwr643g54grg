import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  Building2, 
  Lock, 
  ArrowRight,
  PackageCheck,
  Receipt,
  Loader2,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Edit3,
  Plus
} from 'lucide-react';
import {
  MarketplaceOffer,
  MarketplaceFeeSettings,
  ShippingQuote,
  ShippingAddress,
  ShippingPackage
} from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplaceService';
import { melhorEnvioService, formatShippingServiceName } from '@/services/melhorEnvioService';
import { UserAccount, leadAuthService } from '@/services/leadAuthService';
import { toast } from 'sonner';

interface CheckoutModalProps {
  offer: MarketplaceOffer;
  currentUser: UserAccount;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  offer,
  currentUser: initialUser,
  onClose,
  onSuccess,
}) => {
  // Garante acesso contínuo aos dados mais recentes do usuário / admin logado
  const currentUser = leadAuthService.getCurrentUser() || initialUser;

  const [feeSettings, setFeeSettings] = useState<MarketplaceFeeSettings>({
    defaultFeePercent: 6.5,
    pixDiscountPercent: 0,
  });

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Cartao'>('PIX');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompletedId, setOrderCompletedId] = useState<string | null>(null);

  // Delivery Address Form
  const [address, setAddress] = useState<ShippingAddress>(() => ({
    zipCode: currentUser.shippingZipCode || '',
    street: currentUser.shippingStreet || '',
    number: currentUser.shippingNumber || '',
    complement: currentUser.shippingComplement || '',
    neighborhood: currentUser.shippingNeighborhood || '',
    city: currentUser.shippingCity || 'São Paulo',
    state: currentUser.shippingState || 'SP',
    phone: currentUser.whatsapp || currentUser.shippingPhone || '',
    name: currentUser.ownerName || currentUser.companyName,
    email: currentUser.email,
    cnpj: currentUser.cnpj,
  }));

  // Referência mutável em tempo real para nunca sofrer com closure stale no clique do X ou Comprar
  const addressRef = useRef(address);
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  // Endereço salvo & alternância
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(() => {
    if (currentUser.shippingZipCode && currentUser.shippingStreet) {
      return {
        zipCode: currentUser.shippingZipCode,
        street: currentUser.shippingStreet,
        number: currentUser.shippingNumber || '',
        complement: currentUser.shippingComplement || '',
        neighborhood: currentUser.shippingNeighborhood || '',
        city: currentUser.shippingCity || 'São Paulo',
        state: currentUser.shippingState || 'SP',
        phone: currentUser.whatsapp || currentUser.shippingPhone || '',
        name: currentUser.ownerName || currentUser.companyName,
        email: currentUser.email,
        cnpj: currentUser.cnpj,
      };
    }
    return null;
  });

  const hasSavedAddress = Boolean(savedAddress && savedAddress.zipCode && savedAddress.street);
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(!hasSavedAddress);
  const [cepError, setCepError] = useState<string | null>(null);
  const [isValidatingCep, setIsValidatingCep] = useState<boolean>(false);

  // Shipping Quotes via Melhor Envio
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Card Inputs
  const [cardData, setCardData] = useState({
    number: '',
    holder: currentUser.ownerName || '',
    expiry: '',
    cvv: '',
    installments: '1',
  });

  useEffect(() => {
    marketplaceService.getFeeSettings().then(setFeeSettings);
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const isFreeShipping = offer.freeShipping || offer.shippingPolicy === 'frete_gratis';
  const productPrice = offer.price;
  
  // What buyer actually pays for shipping
  const shippingAmountCharged = isFreeShipping ? 0 : (selectedQuote ? selectedQuote.price : (offer.shippingCost || 0));
  const feePercent = feeSettings.defaultFeePercent || 6.5;
  const platformFeeAmount = (productPrice * feePercent) / 100;
  const totalAmount = productPrice + shippingAmountCharged;

  // Real label cost (from quote snapshot)
  const actualShippingCost = selectedQuote ? selectedQuote.price : 0;
  // Seller shipping cost (if free shipping, seller assumes actual cost)
  const sellerShippingCost = isFreeShipping ? actualShippingCost : 0;
  const sellerNetAmount = productPrice - platformFeeAmount - sellerShippingCost;

  // Salva o endereço no perfil do lead (Supabase) imediatamente e atualiza estado local
  const handleSaveCurrentAddress = async (addrToSave = addressRef.current, showToast = false) => {
    if (!addrToSave.zipCode && !addrToSave.street) return;

    if (addrToSave.zipCode && addrToSave.street) {
      setSavedAddress({ ...addrToSave });
    }

    const success = await leadAuthService.saveShippingAddress(currentUser.id, addrToSave, currentUser.email);
    if (showToast) {
      toast.success('Endereço salvo com sucesso como seu padrão!');
    }
    return success;
  };

  const handleCloseModal = async () => {
    const currentAddr = addressRef.current;
    if (currentAddr.zipCode || currentAddr.street) {
      await leadAuthService.saveShippingAddress(currentUser.id, currentAddr, currentUser.email);
    }
    onClose();
  };

  // Trigger Quote Calculation
  const fetchQuotes = async (destinationCep: string) => {
    const cleanTo = destinationCep.replace(/\D/g, '');
    if (cleanTo.length !== 8) return;

    setIsLoadingQuotes(true);
    setQuoteError(null);

    const fromCep = (offer.originZipCode || '01001000').replace(/\D/g, '');
    const pkg: ShippingPackage = {
      weight: offer.packageWeight || 0.5,
      height: offer.packageHeight || 8,
      width: offer.packageWidth || 15,
      length: offer.packageLength || 20,
      insuranceValue: offer.price,
    };

    try {
      const res = await melhorEnvioService.calculateShipping({
        fromPostalCode: fromCep,
        toPostalCode: cleanTo,
        package: pkg,
        insuranceValue: offer.price,
      });

      if (res.success && res.quotes.length > 0) {
        setQuotes(res.quotes);
        // Default to fastest or lowest price
        setSelectedQuote(res.quotes[0]);
      } else {
        setQuoteError(res.error || 'Nenhuma transportadora disponível para este trecho no momento.');
      }
    } catch (err: any) {
      setQuoteError('Erro ao consultar frete no Melhor Envio.');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // On CEP Change with real-time ViaCEP validation & not-found error
  const handleCepChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setAddress((prev) => ({ ...prev, zipCode: clean }));
    setCepError(null);

    if (clean.length === 8) {
      setIsValidatingCep(true);
      fetch(`https://viacep.com.br/ws/${clean}/json/`)
        .then((r) => r.json())
        .then((data) => {
          setIsValidatingCep(false);
          if (data.erro) {
            setCepError('Este CEP não existe nos Correios. Verifique o número digitado.');
            toast.error('O CEP informado não existe. Por favor, confira o número digitado.');
            setQuotes([]);
            setSelectedQuote(null);
            return;
          }

          setCepError(null);
          const updated: ShippingAddress = {
            ...address,
            zipCode: clean,
            street: data.logradouro || address.street,
            neighborhood: data.bairro || address.neighborhood,
            city: data.localidade || address.city,
            state: data.uf || address.state,
          };
          setAddress(updated);

          // Salva no perfil do lead imediatamente no Supabase
          handleSaveCurrentAddress(updated);

          // Cota frete com o CEP válido
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            fetchQuotes(clean);
          }, 300);
        })
        .catch(() => {
          setIsValidatingCep(false);
          setCepError('Não foi possível verificar o CEP no momento.');
        });
    }
  };

  // Initial calculation if buyer already had a saved CEP
  useEffect(() => {
    if (address.zipCode && address.zipCode.replace(/\D/g, '').length === 8) {
      fetchQuotes(address.zipCode);
    }
  }, []);

  const pixCode = `00020126580014br.gov.bcb.pix0136${offer.id}-cellhub520400005303986540${totalAmount.toFixed(2)}5802BR5925CellHub Intermediacao6009Sao Paulo62070503***6304`;

  const handleCopyPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixCode);
      setCopiedPix(true);
      toast.success('Código PIX Copia e Cola copiado com sucesso!');
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.street.trim() || !address.number.trim()) {
      toast.error('Preencha os dados de endereço de entrega para envio da mercadoria.');
      return;
    }

    if (!selectedQuote && quotes.length > 0) {
      toast.error('Selecione uma modalidade de envio do Melhor Envio.');
      return;
    }

    if (paymentMethod === 'Cartao' && (!cardData.number || !cardData.expiry || !cardData.cvv)) {
      toast.error('Preencha os dados do cartão de crédito corporativo.');
      return;
    }

    setIsProcessing(true);

    // Salva automaticamente o endereço de entrega no perfil do lead e define como padrão
    leadAuthService.saveShippingAddress(currentUser.id, address, currentUser.email);
    setSavedAddress({ ...address });

    // Save buyer delivery address snapshot
    const destinationSnapshot: ShippingAddress = {
      ...address,
      zipCode: address.zipCode.replace(/\D/g, ''),
    };

    // Build seller origin address snapshot
    const originSnapshot: ShippingAddress = {
      zipCode: offer.originZipCode || '01001000',
      street: offer.originStreet || 'Rua Santa Ifigênia',
      number: offer.originNumber || '100',
      complement: offer.originComplement || '',
      neighborhood: offer.originNeighborhood || 'Centro',
      city: offer.originCity || 'São Paulo',
      state: offer.originState || 'SP',
      name: offer.sellerOwner || offer.sellerCompany,
      phone: offer.sellerCnpj || '11999999999',
      email: offer.sellerEmail || 'vendas@cellhub.shop',
      cnpj: offer.sellerCnpj,
    };

    const packageSnapshot: ShippingPackage = {
      weight: offer.packageWeight || 0.5,
      height: offer.packageHeight || 8,
      width: offer.packageWidth || 15,
      length: offer.packageLength || 20,
      insuranceValue: offer.price,
    };

    try {
      // 1. Cria o pedido no CellHub com todos os valores e snapshots segregados
      const result = await marketplaceService.createOrder({
        offerId: offer.id,
        buyerId: currentUser.id,
        buyerCompany: currentUser.companyName,
        buyerOwner: currentUser.ownerName,
        buyerEmail: currentUser.email,
        buyerCnpj: currentUser.cnpj,
        sellerId: offer.sellerId,
        sellerCompany: offer.sellerCompany,
        productTitle: offer.title,
        productImage: offer.images?.[0] || '',
        productPrice,
        shippingCost: shippingAmountCharged,
        platformFeePercent: feePercent,
        platformFeeAmount,
        sellerNetAmount,
        totalAmount,
        paymentMethod,
        paymentStatus: 'pago',
        orderStatus: 'aguardando_envio',
        
        // Separação contábil estrita
        productAmount: productPrice,
        shippingAmountCharged: shippingAmountCharged,
        actualShippingCost: actualShippingCost,
        sellerShippingCost: sellerShippingCost,
        shippingDifference: shippingAmountCharged - actualShippingCost,

        // Snapshots imutáveis
        shippingAddress: destinationSnapshot,
        shippingOriginSnapshot: originSnapshot,
        shippingDestinationSnapshot: destinationSnapshot,
        shippingPackageSnapshot: packageSnapshot,
        shippingQuoteSnapshot: selectedQuote || undefined,
        
        shippingStatus: 'pago',
      });

      if (!result.success || !result.orderId) {
        throw new Error(result.error || 'Erro ao criar pedido.');
      }

      const createdOrderId = result.orderId;

      // 2. Dispara a compra da etiqueta no Melhor Envio via saldo da conta CellHub
      // Nota: o backend realiza essa compra utilizando a carteira oficial do CellHub
      melhorEnvioService.createAndPurchaseLabel(createdOrderId).then((labelRes) => {
        if (labelRes.success) {
          console.log('[Melhor Envio] Etiqueta comprada com sucesso para o pedido:', createdOrderId);
        } else {
          console.warn('[Melhor Envio] Pendência na compra da etiqueta:', labelRes.error);
        }
      });

      setIsProcessing(false);
      setOrderCompletedId(createdOrderId);
      toast.success('Pagamento B2B confirmado! O valor foi retido com segurança em custódia.');
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err.message || 'Erro ao processar pedido.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-[#070b16] border border-[#00D287]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080c17]/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00D287]/15 text-[#00D287] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#00D287]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                Checkout B2B Seguro • CellHub Custódia
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Logística automatizada via Melhor Envio com rastreamento oficial
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {orderCompletedId ? (
            /* Order Success View */
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#00D287]/20 border-2 border-[#00D287] text-[#00D287] mx-auto flex items-center justify-center">
                <PackageCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Pedido B2B Gerado com Sucesso!
                </span>
                <h3 className="text-2xl font-black text-white mt-3">
                  Pagamento Confirmado em Custódia
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  ID do Pedido: <span className="text-white font-mono font-bold">{orderCompletedId}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 max-w-md mx-auto text-left text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Produto:</span>
                  <span className="text-white font-semibold truncate max-w-[200px]">{offer.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendedor:</span>
                  <span className="text-slate-200">{offer.sellerCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Envio Selecionado:</span>
                  <span className="text-[#00D287] font-semibold">
                    {selectedQuote ? formatShippingServiceName(selectedQuote.company.name, selectedQuote.name).fullName : 'Envio Padrão'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor do Frete:</span>
                  <span className="text-white font-semibold">
                    {isFreeShipping ? 'Grátis' : formatBRL(shippingAmountCharged)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">Total Pago:</span>
                  <span className="text-[#00D287] font-bold text-sm">{formatBRL(totalAmount)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-md mx-auto">
                O envio está sendo processado através da integração com o <strong>Melhor Envio</strong>. O vendedor imprimirá a etiqueta oficial e despachará nos Correios/Transportadora.
              </p>

              <button
                onClick={() => {
                  onSuccess(orderCompletedId);
                  handleCloseModal();
                }}
                className="px-8 py-3 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-sm shadow-lg shadow-[#00D287]/20 transition-all"
              >
                Ver Pedido em Minhas Compras
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleConfirmOrder} className="space-y-6">
              {/* Product Summary Mini Card */}
              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex-shrink-0">
                  <img
                    src={offer.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#00D287] uppercase tracking-wider">
                    {offer.category} • {offer.condition}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{offer.title}</h4>
                  <p className="text-xs text-slate-400">Vendedor: {offer.sellerCompany}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white">{formatBRL(productPrice)}</span>
                  <span className="text-[11px] text-emerald-400 block font-semibold">
                    {isFreeShipping ? 'Frete Grátis' : `+ ${formatBRL(shippingAmountCharged)} frete`}
                  </span>
                </div>
              </div>

              {/* Delivery Address Form / Saved Address Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#00D287]" /> Endereço de Entrega do Lojista
                  </h4>
                  {hasSavedAddress && !isEditingAddress && (
                    <span className="text-[10px] bg-[#00D287]/20 text-[#00D287] border border-[#00D287]/30 px-2 py-0.5 rounded-full font-bold">
                      Endereço Salvo no Perfil
                    </span>
                  )}
                </div>

                {hasSavedAddress && !isEditingAddress ? (
                  /* Card de Endereço Já Cadastrado */
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-[#00D287]/30 space-y-3 shadow-md shadow-black/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{address.street}, {address.number || 'S/N'}</span>
                          {address.complement && <span className="text-slate-400 font-normal">({address.complement})</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {address.neighborhood ? `${address.neighborhood} • ` : ''}
                          {address.city}/{address.state}
                        </div>
                        <div className="text-[11px] font-mono text-[#00D287] pt-0.5">
                          CEP: {address.zipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(true)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Editar este endereço"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#00D287]" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddress({
                              ...address,
                              zipCode: '',
                              street: '',
                              number: '',
                              complement: '',
                              neighborhood: '',
                              city: '',
                              state: '',
                            });
                            setQuotes([]);
                            setSelectedQuote(null);
                            setIsEditingAddress(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inserir um novo endereço de entrega"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#00D287]" />
                          Novo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Formulário de Digitação / Edição de Endereço */
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                    {hasSavedAddress && (
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[11px] text-slate-400">Preencha os campos para alterar ou cadastrar novo endereço:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (savedAddress) {
                              setAddress({ ...savedAddress });
                              if (savedAddress.zipCode) fetchQuotes(savedAddress.zipCode);
                            }
                            setIsEditingAddress(false);
                            setCepError(null);
                          }}
                          className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Cancelar e manter salvo
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          CEP de Destino * {isValidatingCep && <span className="text-[#00D287] animate-pulse">(Validando...)</span>}
                        </label>
                        <input
                          type="text"
                          maxLength={9}
                          value={address.zipCode}
                          onChange={(e) => handleCepChange(e.target.value)}
                          onBlur={() => handleSaveCurrentAddress()}
                          placeholder="00000-000"
                          className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none font-mono ${
                            cepError ? 'border-rose-500 focus:border-rose-500 text-rose-300' : 'border-white/10 focus:border-[#00D287]'
                          }`}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          Rua / Logradouro *
                        </label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          onBlur={() => handleSaveCurrentAddress()}
                          placeholder="Ex: Av. Paulista"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Alerta explícito quando o CEP não existe */}
                    {cepError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        <span>{cepError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          Número *
                        </label>
                        <input
                          type="text"
                          value={address.number}
                          onChange={(e) => setAddress({ ...address, number: e.target.value })}
                          onBlur={() => handleSaveCurrentAddress()}
                          placeholder="1000"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          Complemento
                        </label>
                        <input
                          type="text"
                          value={address.complement}
                          onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                          onBlur={() => handleSaveCurrentAddress()}
                          placeholder="Sala 12"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          Bairro *
                        </label>
                        <input
                          type="text"
                          value={address.neighborhood}
                          onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                          onBlur={() => handleSaveCurrentAddress()}
                          placeholder="Bela Vista"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 font-medium mb-1">
                          Cidade / UF *
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            onBlur={() => handleSaveCurrentAddress()}
                            placeholder="São Paulo"
                            className="w-2/3 bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                            required
                          />
                          <input
                            type="text"
                            maxLength={2}
                            value={address.state}
                            onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                            onBlur={() => handleSaveCurrentAddress()}
                            placeholder="SP"
                            className="w-1/3 bg-slate-950 border border-white/10 rounded-xl px-1 py-2 text-xs text-white placeholder:text-slate-600 focus:border-[#00D287] outline-none text-center font-bold"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] text-slate-400">
                        O endereço digitado será salvo automaticamente no seu perfil.
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!address.street.trim() || !address.number.trim()) {
                            toast.error('Preencha ao menos Rua e Número antes de salvar.');
                            return;
                          }
                          await handleSaveCurrentAddress(address, true);
                          setIsEditingAddress(false);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00D287]/20 hover:bg-[#00D287]/30 border border-[#00D287]/40 text-[#00D287] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#00D287]/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar como Endereço Padrão
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Opções de Envio (Melhor Envio) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#00D287]" /> Modalidade de Envio (Melhor Envio)
                  </h4>
                  {isLoadingQuotes && (
                    <span className="text-[11px] text-[#00D287] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cotando transportadoras...
                    </span>
                  )}
                </div>

                {isFreeShipping ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Frete Grátis Oferecido pelo Vendedor</div>
                        <div className="text-[11px] text-slate-400">O vendedor cobrirá o custo da etiqueta no Melhor Envio.</div>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">R$ 0,00</span>
                  </div>
                ) : quoteError ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{quoteError}</span>
                  </div>
                ) : quotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {quotes.map((q) => {
                      const isSelected = selectedQuote?.id === q.id;
                      const formattedService = formatShippingServiceName(q.company?.name, q.name);
                      return (
                        <div
                          key={q.id}
                          onClick={() => setSelectedQuote(q)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#00D287] bg-[#00D287]/10 text-white shadow-md shadow-[#00D287]/10'
                              : 'border-white/10 bg-slate-950/60 hover:border-white/20 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#00D287] bg-[#00D287]' : 'border-slate-500'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">
                                {formattedService.fullName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Previsão: {q.delivery_time} {q.delivery_time === 1 ? 'dia útil' : 'dias úteis'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black text-[#00D287]">{formatBRL(q.price)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 text-center">
                    Informe seu CEP acima para carregar as cotações oficiais de frete.
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#00D287]" /> Método de Pagamento B2B
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'PIX'
                        ? 'border-[#00D287] bg-[#00D287]/10 text-white'
                        : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#00D287]" />
                    <div>
                      <span className="text-xs font-bold block text-white">PIX Imediato</span>
                      <span className="text-[10px] text-slate-400">Liberação instantânea</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cartao')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'Cartao'
                        ? 'border-[#00D287] bg-[#00D287]/10 text-white'
                        : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#00D287]" />
                    <div>
                      <span className="text-xs font-bold block text-white">Cartão Corporativo</span>
                      <span className="text-[10px] text-slate-400">Até 12x via Gateway</span>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'PIX' ? (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3 text-center">
                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixCode)}`}
                        alt="QR Code PIX"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Escaneie o QR Code ou copie o código PIX para efetuar o pagamento seguro com custódia CellHub.
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white border border-white/10 flex items-center gap-2 mx-auto transition-colors"
                    >
                      {copiedPix ? <Check className="w-4 h-4 text-[#00D287]" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      {copiedPix ? 'Código PIX Copiado!' : 'Copiar Código PIX'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        placeholder="0000 0000 0000 0000"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1">
                          Validade (MM/AA)
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          placeholder="12/28"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          placeholder="123"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:border-[#00D287] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Breakdown Table */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal do Produto:</span>
                  <span className="text-white font-semibold">{formatBRL(productPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Frete ({selectedQuote ? selectedQuote.name : (isFreeShipping ? 'Grátis' : 'A calcular')}):</span>
                  <span className="text-white font-semibold">
                    {isFreeShipping ? 'Grátis (R$ 0,00)' : formatBRL(shippingAmountCharged)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxa de Intermediação CellHub:</span>
                  <span className="text-emerald-400 font-semibold">Inclusa no repasse</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/10 text-white">
                  <span>Total a Pagar:</span>
                  <span className="text-base font-black text-[#00D287]">{formatBRL(totalAmount)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-[#00D287] hover:bg-[#00b875] text-slate-950 font-bold text-sm shadow-xl shadow-[#00D287]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando Pagamento & Compra de Envio...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Confirmar Pagamento • {formatBRL(totalAmount)}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
