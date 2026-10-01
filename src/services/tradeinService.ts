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

export const tradeinService = {
  // Obter todos os modelos cadastrados no banco
  async getModels(brand?: string, includeInactive = false): Promise<ValuationModel[]> {
    try {
      let query = supabase
        .from('valuation_models')
        .select('*')
        .order('display_order', { ascending: true })
        .order('model_name', { ascending: true });

      if (brand && brand !== 'Todos' && brand !== 'Outros') {
        query = query.eq('brand', brand);
      }

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar modelos de avaliação:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
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

  // Salvar / Atualizar modelo (Admin)
  async saveModel(model: Partial<ValuationModel>): Promise<{ success: boolean; data?: ValuationModel; error?: string }> {
    try {
      const payload: any = {
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

      if (model.id) {
        const { data, error } = await supabase
          .from('valuation_models')
          .update(payload)
          .eq('id', model.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
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

  // Deletar modelo (Admin)
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

  // Salvar Avaliação Concluída (Compra ou Troca)
  async createEvaluation(evaluation: {
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
      const randomCode = `AV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const payload = {
        evaluation_code: randomCode,
        created_by_id: evaluation.created_by_id || null,
        created_by_name: evaluation.created_by_name || 'Vendedor Lojista',
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
      console.error('Erro ao registrar avaliação:', err);
      return { success: false, error: err.message };
    }
  },

  // Buscar Histórico de Avaliações
  async getEvaluations(searchQuery?: string): Promise<TradeInEvaluation[]> {
    try {
      let query = supabase
        .from('tradein_evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let list = (data || []).map((row: any) => ({
        id: row.id,
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

  // Obter Configurações
  async getSettings(): Promise<ValuationSettings> {
    try {
      const { data, error } = await supabase
        .from('valuation_settings')
        .select('*')
        .limit(1)
        .single();

      if (error || !data) {
        return {
          store_name: 'CellHub Lojista',
          store_cnpj: '',
          store_address: '',
          default_trade_bonus: 100,
          terms_text: 'Declaro para os devidos fins que sou o legítimo proprietário do aparelho acima qualificado, respondendo civil e criminalmente pela procedência lícita do mesmo, atestando que o mesmo não é fruto de furto, roubo ou qualquer ilícito.'
        };
      }

      return {
        id: data.id,
        store_name: data.store_name,
        store_cnpj: data.store_cnpj || '',
        store_address: data.store_address || '',
        default_trade_bonus: Number(data.default_trade_bonus) || 100,
        terms_text: data.terms_text || ''
      };
    } catch (err) {
      return {
        store_name: 'CellHub Lojista',
        store_cnpj: '',
        store_address: '',
        default_trade_bonus: 100,
        terms_text: 'Declaro para os devidos fins que sou o legítimo proprietário do aparelho acima qualificado, respondendo civil e criminalmente pela procedência lícita do mesmo.'
      };
    }
  },

  // Salvar Configurações (Admin)
  async saveSettings(settings: ValuationSettings): Promise<boolean> {
    try {
      const payload = {
        store_name: settings.store_name,
        store_cnpj: settings.store_cnpj,
        store_address: settings.store_address,
        default_trade_bonus: Number(settings.default_trade_bonus) || 0,
        terms_text: settings.terms_text,
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
      console.error('Erro ao salvar configurações de avaliação:', err);
      return false;
    }
  }
};
