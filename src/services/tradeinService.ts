import { supabase } from '@/integrations/supabase/client';
import { 
  DeviceBrand, 
  FaultDefinition, 
  ValuationModel, 
  TradeInEvaluation, 
  ValuationSettings,
  SelectedFault 
} from '@/types/tradein';

export const FAULT_DEFINITIONS: FaultDefinition[] = [
  { id: 'marcas_leves', category: 'estetica', label: 'Marcas leves', description: 'Micro-riscos normais de uso no aro ou traseira', defaultDiscount: 150 },
  { id: 'marcas_moderadas', category: 'estetica', label: 'Marcas moderadas', description: 'Arranhões perceptíveis na carcaça ou bordas', defaultDiscount: 350 },
  { id: 'bateria_baixa', category: 'bateria', label: 'Bateria (saúde baixa)', description: 'Bateria com degradação química acentuada (< 80%)', defaultDiscount: 300 },
  { id: 'tela_quebrada', category: 'tela', label: 'Troca de tela', description: 'Vidro trincado ou necessidade de substituição do display', defaultDiscount: 850 },
  { id: 'traseira_danificada', category: 'estetica', label: 'Traseira', description: 'Vidro traseiro trincado ou carcaça danificada', defaultDiscount: 400 },
  { id: 'face_id', category: 'cameras_sensores', label: 'Face ID / Biometria', description: 'Reconhecimento facial ou leitor biométrico inoperante', defaultDiscount: 600 },
  { id: 'conector_carga', category: 'bateria', label: 'Doc de carga', description: 'Conector de carga com mau contato ou sem carregar', defaultDiscount: 250 },
  { id: 'camera_traseira', category: 'cameras_sensores', label: 'Câmera traseira', description: 'Lente com avaria, manchas ou vibração no foco', defaultDiscount: 650 },
  { id: 'camera_frontal', category: 'cameras_sensores', label: 'Câmera frontal', description: 'Câmera frontal embaçada ou defeituosa', defaultDiscount: 300 },
  { id: 'notif_camera', category: 'placa_sistema', label: 'Notif. peça — câmera', description: 'Aviso de peça desconhecida / não genuína da câmera', defaultDiscount: 500 },
  { id: 'notif_bateria', category: 'placa_sistema', label: 'Notif. peça — bateria', description: 'Aviso de peça desconhecida / não genuína da bateria', defaultDiscount: 350 },
  { id: 'notif_tela', category: 'placa_sistema', label: 'Notif. peça — tela', description: 'Aviso de peça desconhecida / não genuína do display', defaultDiscount: 450 },
  { id: 'sinais_oxidacao', category: 'placa_sistema', label: 'Sinais de oxidação', description: 'Contato com líquido ou sensores de umidade ativados', defaultDiscount: 1000 },
];

export const BRANDS_LIST: DeviceBrand[] = [
  'Apple',
  'Samsung',
  'Motorola',
  'Xiaomi',
  'Redmi',
  'POCO',
  'Realme',
  'Infinix',
  'Tecno',
  'Outros'
];

export const DEFAULT_LEGAL_TERMS = `DECLARAÇÃO DE PROPRIEDADE, PROCEDÊNCIA E RESPONSABILIDADE CIVIL E PENAL:

1. O(A) VENDEDOR(A) acima qualificado(a) declara, sob as penas do art. 299 do Código Penal Brasileiro (Falsidade Ideológica) e do art. 180 (Receptação), ser o(a) legítimo(a) proprietário(a) e possuidor(a) de boa-fé do smartphone/aparelho acima discriminado e caracterizado pelo seu respectivo número de IMEI.

2. Declara expressamente que o aparelho encontra-se 100% livre e desembaraçado de quaisquer ônus, dúvidas, pendências financeiras, bloqueios de operadoras, queixas de furto, roubo ou extravio, com todas as contas de usuário (iCloud, Google, Samsung Account, Mi Cloud ou similares) devidamente desvinculadas.

3. O(A) VENDEDOR(A) assume total e irrestrita responsabilidade civil e criminal pela procedência lícita do bem alienado, isentando a LOJA COMPRADORA e seus responsáveis legais de qualquer responsabilidade perante autoridades policiais, judiciais ou terceiros.

4. Em caso de constatação de bloqueio por perda/furto/roubo posterior a esta data, o(A) VENDEDOR(A) obriga-se a ressarcir integral e imediatamente à LOJA COMPRADORA o valor total recebido na transação, acrescido de perdas e danos.`;

export const tradeinService = {
  // Obter modelos da tabela do lojista (com fallback para os modelos padrão)
  async getModels(brand?: string, userId?: string, includeInactive = false): Promise<ValuationModel[]> {
    try {
      // 1. Se o usuário tem modelos personalizados com o seu user_id
      if (userId) {
        let userQuery = supabase
          .from('valuation_models')
          .select('*')
          .eq('user_id', userId)
          .order('display_order', { ascending: true })
          .order('model_name', { ascending: true });

        if (brand && brand !== 'Todos' && brand !== 'Outros') {
          userQuery = userQuery.eq('brand', brand);
        }
        if (!includeInactive) {
          userQuery = userQuery.eq('is_active', true);
        }

        const { data: userData, error: userError } = await userQuery;

        if (!userError && userData && userData.length > 0) {
          return userData.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            brand: row.brand,
            model_name: row.model_name,
            storage: row.storage,
            base_price: Number(row.base_price) || 0,
            buy_price: Number(row.buy_price) || 0,
            trade_bonus: Number(row.trade_bonus) || 0,
            fault_discounts: row.fault_discounts || {},
            is_active: row.is_active,
            display_order: row.display_order || 0,
            created_at: row.created_at,
            updated_at: row.updated_at
          }));
        }
      }

      // 2. Se não tem dados personalizados ainda, buscar modelos padrão (user_id IS NULL)
      let defaultQuery = supabase
        .from('valuation_models')
        .select('*')
        .is('user_id', null)
        .order('display_order', { ascending: true })
        .order('model_name', { ascending: true });

      if (brand && brand !== 'Todos' && brand !== 'Outros') {
        defaultQuery = defaultQuery.eq('brand', brand);
      }
      if (!includeInactive) {
        defaultQuery = defaultQuery.eq('is_active', true);
      }

      const { data, error } = await defaultQuery;
      if (error) {
        console.error('Erro ao buscar modelos padrão:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        brand: row.brand,
        model_name: row.model_name,
        storage: row.storage,
        base_price: Number(row.base_price) || 0,
        buy_price: Number(row.buy_price) || 0,
        trade_bonus: Number(row.trade_bonus) || 0,
        fault_discounts: row.fault_discounts || {},
        is_active: row.is_active,
        display_order: row.display_order || 0,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (err) {
      console.error('Erro em getModels:', err);
      return [];
    }
  },

  // Salvar / Atualizar modelo do lojista
  async saveModel(model: Partial<ValuationModel>, userId?: string): Promise<{ success: boolean; data?: ValuationModel; error?: string }> {
    try {
      const payload: any = {
        user_id: userId || model.user_id || null,
        brand: model.brand,
        model_name: model.model_name,
        storage: model.storage || '128GB',
        base_price: Number(model.base_price) || 0,
        buy_price: Number(model.buy_price) || 0,
        trade_bonus: Number(model.trade_bonus) || 0,
        fault_discounts: model.fault_discounts || {},
        is_active: model.is_active !== undefined ? model.is_active : true,
        display_order: Number(model.display_order) || 0,
        updated_at: new Date().toISOString()
      };

      if (model.id && model.user_id) {
        // Atualizar modelo já existente do usuário
        const { data, error } = await supabase
          .from('valuation_models')
          .update(payload)
          .eq('id', model.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
        // Inserir novo modelo para este usuário
        const { data, error } = await supabase
          .from('valuation_models')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }
    } catch (err: any) {
      console.error('Erro ao salvar modelo:', err);
      return { success: false, error: err.message };
    }
  },

  // Clonar catálogo padrão para o lojista personalizar livremente
  async initializeCustomCatalogForUser(userId: string): Promise<boolean> {
    try {
      if (!userId) return false;

      // Verificar se já tem modelos
      const { data: existing } = await supabase
        .from('valuation_models')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) return true;

      // Buscar todos os modelos padrão
      const { data: defaultModels } = await supabase
        .from('valuation_models')
        .select('*')
        .is('user_id', null);

      if (!defaultModels || defaultModels.length === 0) return true;

      // Inserir cópias vinculadas ao user_id do lojista
      const copies = defaultModels.map((m: any) => ({
        user_id: userId,
        brand: m.brand,
        model_name: m.model_name,
        storage: m.storage,
        base_price: m.base_price,
        buy_price: m.buy_price,
        trade_bonus: m.trade_bonus,
        fault_discounts: m.fault_discounts,
        is_active: m.is_active,
        display_order: m.display_order
      }));

      await supabase.from('valuation_models').insert(copies);
      return true;
    } catch (err) {
      console.error('Erro ao inicializar catálogo personalizado:', err);
      return false;
    }
  },

  // Deletar modelo
  async deleteModel(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('valuation_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar modelo:', err);
      return false;
    }
  },

  // Salvar Avaliação / Termo de Compra Concluído no Histórico
  async createEvaluation(evaluation: {
    userId?: string;
    type: 'compra' | 'troca';
    brand: string;
    model_name: string;
    storage: string;
    imei?: string;
    base_value: number;
    faults_selected: SelectedFault[];
    total_faults_discount: number;
    trade_bonus_applied: number;
    custom_adjustment?: number;
    adjustment_reason?: string;
    final_valuation: number;
    exchange_target_device?: string;
    exchange_target_price?: number;
    exchange_difference_to_pay?: number;
    customer_data?: any;
    signature_data?: string;
    created_by_id?: string;
    created_by_name?: string;
  }): Promise<{ success: boolean; evaluation?: TradeInEvaluation; error?: string }> {
    try {
      const randomCode = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const payload = {
        user_id: evaluation.userId || evaluation.created_by_id || null,
        evaluation_code: randomCode,
        created_by_id: evaluation.created_by_id || null,
        created_by_name: evaluation.created_by_name || 'Lojista',
        type: evaluation.type,
        brand: evaluation.brand,
        model_name: evaluation.model_name,
        storage: evaluation.storage,
        imei: evaluation.imei?.trim() || null,
        base_value: evaluation.base_value,
        faults_selected: evaluation.faults_selected,
        total_faults_discount: evaluation.total_faults_discount,
        trade_bonus_applied: evaluation.trade_bonus_applied,
        custom_adjustment: evaluation.custom_adjustment || 0,
        adjustment_reason: evaluation.adjustment_reason || null,
        final_valuation: evaluation.final_valuation,
        exchange_target_device: evaluation.exchange_target_device || null,
        exchange_target_price: evaluation.exchange_target_price || 0,
        exchange_difference_to_pay: evaluation.exchange_difference_to_pay || 0,
        status: 'concluida',
        customer_data: evaluation.customer_data || {},
        signature_data: evaluation.signature_data || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tradein_evaluations')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { success: true, evaluation: data as TradeInEvaluation };
    } catch (err: any) {
      console.error('Erro ao registrar termo no histórico:', err);
      return { success: false, error: err.message };
    }
  },

  // Buscar Histórico de Termos do Lojista
  async getEvaluations(userId?: string, searchQuery?: string): Promise<TradeInEvaluation[]> {
    try {
      let query = supabase
        .from('tradein_evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.eq.${userId},created_by_id.eq.${userId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let list = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        evaluation_code: row.evaluation_code,
        created_by_id: row.created_by_id,
        created_by_name: row.created_by_name,
        type: row.type,
        brand: row.brand,
        model_name: row.model_name,
        storage: row.storage,
        imei: row.imei,
        base_value: Number(row.base_value) || 0,
        faults_selected: row.faults_selected || [],
        total_faults_discount: Number(row.total_faults_discount) || 0,
        trade_bonus_applied: Number(row.trade_bonus_applied) || 0,
        custom_adjustment: Number(row.custom_adjustment) || 0,
        adjustment_reason: row.adjustment_reason,
        final_valuation: Number(row.final_valuation) || 0,
        exchange_target_device: row.exchange_target_device,
        exchange_target_price: Number(row.exchange_target_price) || 0,
        exchange_difference_to_pay: Number(row.exchange_difference_to_pay) || 0,
        status: row.status,
        customer_data: row.customer_data || {},
        signature_data: row.signature_data,
        created_at: row.created_at
      }));

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter((item) => 
          item.evaluation_code.toLowerCase().includes(q) ||
          item.model_name.toLowerCase().includes(q) ||
          (item.imei && item.imei.toLowerCase().includes(q)) ||
          (item.customer_data?.name && item.customer_data.name.toLowerCase().includes(q)) ||
          (item.customer_data?.cpf && item.customer_data.cpf.includes(q))
        );
      }

      return list;
    } catch (err) {
      console.error('Erro ao buscar histórico de avaliações:', err);
      return [];
    }
  },

  // Obter Configurações do Lojista
  async getSettings(userId?: string): Promise<ValuationSettings> {
    try {
      if (userId) {
        const { data: userSettings } = await supabase
          .from('valuation_settings')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .single();

        if (userSettings) {
          return {
            id: userSettings.id,
            user_id: userSettings.user_id,
            store_name: userSettings.store_name || 'Minha Loja de Celulares',
            store_cnpj: userSettings.store_cnpj || '',
            store_address: userSettings.store_address || '',
            default_trade_bonus: Number(userSettings.default_trade_bonus) || 100,
            terms_text: userSettings.terms_text || DEFAULT_LEGAL_TERMS
          };
        }
      }

      // Fallback para configurações globais
      const { data } = await supabase
        .from('valuation_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          store_name: data.store_name || 'Minha Loja de Celulares',
          store_cnpj: data.store_cnpj || '',
          store_address: data.store_address || '',
          default_trade_bonus: Number(data.default_trade_bonus) || 100,
          terms_text: data.terms_text || DEFAULT_LEGAL_TERMS
        };
      }

      return {
        store_name: 'Minha Loja de Celulares',
        store_cnpj: '',
        store_address: '',
        default_trade_bonus: 100,
        terms_text: DEFAULT_LEGAL_TERMS
      };
    } catch (err) {
      return {
        store_name: 'Minha Loja de Celulares',
        store_cnpj: '',
        store_address: '',
        default_trade_bonus: 100,
        terms_text: DEFAULT_LEGAL_TERMS
      };
    }
  },

  // Salvar Configurações do Lojista
  async saveSettings(settings: ValuationSettings, userId?: string): Promise<boolean> {
    try {
      const payload = {
        user_id: userId || settings.user_id || null,
        store_name: settings.store_name,
        store_cnpj: settings.store_cnpj,
        store_address: settings.store_address,
        default_trade_bonus: Number(settings.default_trade_bonus) || 100,
        terms_text: settings.terms_text || DEFAULT_LEGAL_TERMS,
        updated_at: new Date().toISOString()
      };

      if (settings.id) {
        await supabase
          .from('valuation_settings')
          .update(payload)
          .eq('id', settings.id);
      } else {
        await supabase
          .from('valuation_settings')
          .insert(payload);
      }
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações do lojista:', err);
      return false;
    }
  }
};
