import { supabase } from '@/integrations/supabase/client';
import { 
  DeviceBrand, 
  FaultDefinition, 
  ValuationModel, 
  TradeInEvaluation, 
  ValuationSettings,
  SelectedFault 
} from '@/types/tradein';

// 1. PRESETS ESPECÍFICOS POR FABRICANTE
export const BRAND_PRESETS: Record<string, FaultDefinition[]> = {
  // APPLE
  Apple: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 35, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 85, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 150, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Troca de tela', defaultDiscount: 240, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / vidro traseiro danificado', defaultDiscount: 85, category: 'estetica' },
    { id: 'face_id', label: 'Face ID / Biometria com problema', defaultDiscount: 600, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Dock / conector de carga', defaultDiscount: 250, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 650, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 300, category: 'cameras_sensores' },
    { id: 'notif_camera', label: 'Notificação de peça — câmera', defaultDiscount: 500, category: 'placa_sistema' },
    { id: 'notif_bateria', label: 'Notificação de peça — bateria', defaultDiscount: 350, category: 'placa_sistema' },
    { id: 'notif_tela', label: 'Notificação de peça — tela', defaultDiscount: 450, category: 'placa_sistema' },
    { id: 'sinais_oxidacao', label: 'Sinais de oxidação', defaultDiscount: 1000, category: 'placa_sistema' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 150, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 150, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 250, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 100, category: 'estetica' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de ativação', defaultDiscount: 1000, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original identificada', defaultDiscount: 300, category: 'placa_sistema' },
  ],

  // SAMSUNG
  Samsung: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 35, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 80, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 120, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 250, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 300, category: 'tela' },
    { id: 'burn_in', label: 'Burn-in / retenção de imagem', defaultDiscount: 250, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa traseira danificada', defaultDiscount: 100, category: 'estetica' },
    { id: 'biometria', label: 'Leitor de digital / biometria com problema', defaultDiscount: 250, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 200, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 350, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 200, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 120, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 120, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 180, category: 'placa_sistema' },
    { id: 'nfc', label: 'NFC com problema', defaultDiscount: 150, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 100, category: 'estetica' },
    { id: 'spen_defeito', label: 'S Pen com problema', defaultDiscount: 250, category: 'outros', requiresSPen: true },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 500, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível identificado', defaultDiscount: 250, category: 'placa_sistema' },
    { id: 'bloqueio_conta', label: 'Aparelho com bloqueio de conta / restrição', defaultDiscount: 500, category: 'placa_sistema' },
  ],

  // MOTOROLA
  Motorola: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 30, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 70, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 100, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 200, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 220, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa danificada', defaultDiscount: 80, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 180, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 180, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 300, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 150, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 150, category: 'placa_sistema' },
    { id: 'nfc', label: 'NFC com problema', defaultDiscount: 120, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 80, category: 'estetica' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 400, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível', defaultDiscount: 180, category: 'placa_sistema' },
    { id: 'carregamento_sem_fio', label: 'Problema no carregamento sem fio', defaultDiscount: 150, category: 'bateria' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 400, category: 'placa_sistema' },
  ],

  // XIAOMI (Também cobre Redmi e POCO)
  Xiaomi: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 30, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 70, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 100, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 220, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 250, category: 'tela' },
    { id: 'burn_in', label: 'Burn-in / retenção de imagem', defaultDiscount: 200, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa danificada', defaultDiscount: 80, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 180, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 180, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 300, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 150, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 150, category: 'placa_sistema' },
    { id: 'nfc', label: 'NFC com problema', defaultDiscount: 120, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 80, category: 'estetica' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 400, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível', defaultDiscount: 180, category: 'placa_sistema' },
    { id: 'carregamento_rapido', label: 'Problema de carregamento rápido', defaultDiscount: 120, category: 'bateria' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 400, category: 'placa_sistema' },
  ],

  // REALME
  Realme: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 30, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 60, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 90, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 180, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 200, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa danificada', defaultDiscount: 70, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 150, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 150, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 250, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 130, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 90, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 90, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 130, category: 'placa_sistema' },
    { id: 'nfc', label: 'NFC com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 70, category: 'estetica' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 350, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível', defaultDiscount: 150, category: 'placa_sistema' },
    { id: 'carregamento_rapido', label: 'Problema de carregamento rápido', defaultDiscount: 100, category: 'bateria' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 350, category: 'placa_sistema' },
  ],

  // INFINIX
  Infinix: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 25, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 50, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 80, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 150, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 180, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa danificada', defaultDiscount: 60, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 120, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 120, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 180, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 100, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 70, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 70, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'nfc', label: 'NFC com problema', defaultDiscount: 80, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 60, category: 'estetica' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 250, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível', defaultDiscount: 120, category: 'placa_sistema' },
    { id: 'carregamento_problema', label: 'Problema de carregamento', defaultDiscount: 100, category: 'bateria' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 250, category: 'placa_sistema' },
  ],

  // ITEL
  Itel: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 20, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 40, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 60, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 100, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 120, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa danificada', defaultDiscount: 40, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 80, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 80, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 100, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 60, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 50, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 50, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 70, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 40, category: 'estetica' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 150, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível', defaultDiscount: 80, category: 'placa_sistema' },
    { id: 'carregamento_problema', label: 'Problema de carregamento', defaultDiscount: 70, category: 'bateria' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 150, category: 'placa_sistema' },
  ],

  // TECNO
  Tecno: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 25, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 50, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 80, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 150, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 170, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa danificada', defaultDiscount: 60, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 120, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 120, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 180, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 100, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 70, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 70, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'nfc', label: 'NFC com problema', defaultDiscount: 80, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 60, category: 'estetica' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 250, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível', defaultDiscount: 120, category: 'placa_sistema' },
    { id: 'carregamento_problema', label: 'Problema de carregamento', defaultDiscount: 100, category: 'bateria' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 250, category: 'placa_sistema' },
  ],

  // HOTWAV
  Hotwav: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 25, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 50, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 80, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 150, category: 'tela' },
    { id: 'tela_manchas', label: 'Tela com manchas / linhas', defaultDiscount: 170, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / carcaça blindada danificada', defaultDiscount: 70, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 100, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 120, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira / lanterna com problema', defaultDiscount: 160, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 90, category: 'cameras_sensores' },
    { id: 'alto_falante', label: 'Alto-falante / áudio com problema', defaultDiscount: 70, category: 'placa_sistema' },
    { id: 'microfone', label: 'Microfone com problema', defaultDiscount: 70, category: 'placa_sistema' },
    { id: 'wifi_bluetooth', label: 'Wi-Fi / Bluetooth com problema', defaultDiscount: 100, category: 'placa_sistema' },
    { id: 'nfc', label: 'NFC com problema', defaultDiscount: 80, category: 'placa_sistema' },
    { id: 'botoes', label: 'Botões / volume / power com problema', defaultDiscount: 60, category: 'estetica' },
    { id: 'vedacao_agua', label: 'Vedação / tampas protetoras danificadas', defaultDiscount: 90, category: 'estetica' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 250, category: 'placa_sistema' },
    { id: 'peca_nao_original', label: 'Peça não original / reparo incompatível', defaultDiscount: 120, category: 'placa_sistema' },
    { id: 'carregamento_problema', label: 'Problema de carregamento', defaultDiscount: 100, category: 'bateria' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 250, category: 'placa_sistema' },
  ],

  // OUTROS (Fallback padrão)
  Outros: [
    { id: 'marcas_leves', label: 'Marcas leves', defaultDiscount: 25, category: 'estetica' },
    { id: 'marcas_moderadas', label: 'Marcas moderadas', defaultDiscount: 50, category: 'estetica' },
    { id: 'bateria_baixa', label: 'Bateria / saúde baixa', defaultDiscount: 80, category: 'bateria' },
    { id: 'tela_quebrada', label: 'Tela quebrada / trincada', defaultDiscount: 150, category: 'tela' },
    { id: 'traseira_danificada', label: 'Traseira / tampa danificada', defaultDiscount: 60, category: 'estetica' },
    { id: 'biometria', label: 'Biometria / leitor digital com problema', defaultDiscount: 100, category: 'cameras_sensores' },
    { id: 'conector_carga', label: 'Conector de carga com problema', defaultDiscount: 100, category: 'bateria' },
    { id: 'camera_traseira', label: 'Câmera traseira com problema', defaultDiscount: 150, category: 'cameras_sensores' },
    { id: 'camera_frontal', label: 'Câmera frontal com problema', defaultDiscount: 80, category: 'cameras_sensores' },
    { id: 'sinais_oxidacao', label: 'Oxidação / sinais de líquido', defaultDiscount: 250, category: 'placa_sistema' },
    { id: 'bloqueio_conta', label: 'Aparelho bloqueado / restrição de conta', defaultDiscount: 250, category: 'placa_sistema' },
  ]
};

// Aliases para famílias e variações de capitalização
export function getBrandPresets(brand: string, modelName?: string): FaultDefinition[] {
  const norm = (brand || '').toLowerCase().trim();
  let baseList: FaultDefinition[] = [];

  if (norm.includes('apple') || norm.includes('iphone')) {
    baseList = BRAND_PRESETS.Apple;
  } else if (norm.includes('samsung')) {
    baseList = BRAND_PRESETS.Samsung;
  } else if (norm.includes('motorola') || norm.includes('moto')) {
    baseList = BRAND_PRESETS.Motorola;
  } else if (norm.includes('xiaomi') || norm.includes('redmi') || norm.includes('poco') || norm.includes('mi ')) {
    baseList = BRAND_PRESETS.Xiaomi;
  } else if (norm.includes('realme')) {
    baseList = BRAND_PRESETS.Realme;
  } else if (norm.includes('infinix')) {
    baseList = BRAND_PRESETS.Infinix;
  } else if (norm.includes('itel')) {
    baseList = BRAND_PRESETS.Itel;
  } else if (norm.includes('tecno')) {
    baseList = BRAND_PRESETS.Tecno;
  } else if (norm.includes('hotwav') || norm.includes('hotway')) {
    baseList = BRAND_PRESETS.Hotwav;
  } else {
    baseList = BRAND_PRESETS.Outros;
  }

  // Filtrar condições especiais (ex: S Pen para Samsung)
  if (norm.includes('samsung')) {
    const modelLower = (modelName || '').toLowerCase();
    const hasSPen = 
      modelLower.includes('ultra') || 
      modelLower.includes('note') || 
      modelLower.includes('fold') || 
      modelLower.includes('s pen') || 
      modelLower.includes('spen') ||
      modelLower.includes('stylus');

    return baseList.filter(preset => {
      if (preset.requiresSPen && !hasSPen) {
        return false;
      }
      return true;
    });
  }

  return baseList;
}

// Fallback genérico para retrocompatibilidade
export const FAULT_DEFINITIONS: FaultDefinition[] = BRAND_PRESETS.Apple;

export const BRANDS_LIST: DeviceBrand[] = [
  'Apple',
  'Samsung',
  'Motorola',
  'Xiaomi',
  'Realme',
  'Infinix',
  'Tecno',
  'Itel',
  'HOTWAV',
  'Outros'
];

export const DEFAULT_LEGAL_TERMS = `DECLARAÇÃO DE PROPRIEDADE, PROCEDÊNCIA E RESPONSABILIDADE CIVIL E PENAL:

1. O(A) VENDEDOR(A) acima qualificado(a) declara, sob as penas do art. 299 do Código Penal Brasileiro (Falsidade Ideológica) e do art. 180 (Receptação), ser o(a) legítimo(a) proprietário(a) e possuidor(a) de boa-fé do smartphone/aparelho acima discriminado e caracterizado pelo seu respectivo número de IMEI.

2. Declara expressamente que o aparelho encontra-se 100% livre e desembaraçado de quaisquer ônus, dúvidas, pendências financeiras, bloqueios de operadoras, queixas de furto, roubo ou extravio, com todas as contas de usuário (iCloud, Google, Samsung Account, Mi Cloud ou similares) devidamente desvinculadas.

3. O(A) VENDEDOR(A) assume total e irrestrita responsabilidade civil e criminal pela procedência lícita do bem alienado, isentando a LOJA COMPRADORA e seus responsáveis legais de qualquer responsabilidade perante autoridades policiais, judiciais ou terceiros.

4. Em caso de constatação de bloqueio por perda/furto/roubo posterior a esta data, o(A) VENDEDOR(A) obriga-se a ressarcir integral e imediatamente à LOJA COMPRADORA o valor total recebido na transação, acrescido de perdas e danos.`;

export const tradeinService = {
  // Obter presets de avaria por fabricante
  getPresetsForBrand(brand: string, modelName?: string): FaultDefinition[] {
    return getBrandPresets(brand, modelName);
  },

  // Obter todos os modelos de forma consolidada e ultra-rápida (com fallback para marcas não customizadas)
  async getAllModels(userId?: string, includeInactive = false): Promise<ValuationModel[]> {
    try {
      // 1. Buscar modelos personalizados do usuário (se logado)
      let userModels: ValuationModel[] = [];
      if (userId) {
        let uQuery = supabase
          .from('valuation_models')
          .select('*')
          .eq('user_id', userId)
          .order('display_order', { ascending: true })
          .order('model_name', { ascending: true });

        if (!includeInactive) {
          uQuery = uQuery.eq('is_active', true);
        }

        const { data: uData } = await uQuery;
        if (uData && uData.length > 0) {
          userModels = uData.map((row: any) => ({
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

      // 2. Buscar modelos padrão globais (user_id IS NULL)
      let dQuery = supabase
        .from('valuation_models')
        .select('*')
        .is('user_id', null)
        .order('display_order', { ascending: true })
        .order('model_name', { ascending: true });

      if (!includeInactive) {
        dQuery = dQuery.eq('is_active', true);
      }

      const { data: dData, error: dError } = await dQuery;
      if (dError) {
        console.error('Erro ao buscar modelos padrão:', dError);
      }

      const defaultModels: ValuationModel[] = (dData || []).map((row: any) => ({
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

      if (userModels.length === 0) {
        return defaultModels;
      }

      // Mesclar modelos do lojista com modelos padrão para marcas que ele ainda não customizou
      const userModelKeys = new Set(
        userModels.map(m => `${(m.brand || '').toLowerCase().trim()}_${(m.model_name || '').toLowerCase().trim()}_${(m.storage || '').toLowerCase().trim()}`)
      );

      const nonOverriddenDefaults = defaultModels.filter(
        m => !userModelKeys.has(`${(m.brand || '').toLowerCase().trim()}_${(m.model_name || '').toLowerCase().trim()}_${(m.storage || '').toLowerCase().trim()}`)
      );

      return [...userModels, ...nonOverriddenDefaults];
    } catch (err) {
      console.error('Erro em getAllModels:', err);
      return [];
    }
  },

  // Obter modelos da tabela do lojista (com fallback para os modelos padrão)
  async getModels(brand?: string, userId?: string, includeInactive = false): Promise<ValuationModel[]> {
    const all = await this.getAllModels(userId, includeInactive);
    if (!brand || brand === 'Todos') return all;
    const bLower = brand.toLowerCase().trim();
    return all.filter(m => (m.brand || '').toLowerCase().trim() === bLower);
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
          .maybeSingle();

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
        .maybeSingle();

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
  // Salvar Configurações do Lojista
  async saveSettings(settings: ValuationSettings, userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || settings.user_id || null;
      const payload = {
        user_id: targetUserId,
        store_name: settings.store_name,
        store_cnpj: settings.store_cnpj,
        store_address: settings.store_address,
        default_trade_bonus: Number(settings.default_trade_bonus) || 100,
        terms_text: settings.terms_text || DEFAULT_LEGAL_TERMS,
        updated_at: new Date().toISOString()
      };

      if (settings.id) {
        const { error } = await supabase
          .from('valuation_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else if (targetUserId) {
        const { data: existing } = await supabase
          .from('valuation_settings')
          .select('id')
          .eq('user_id', targetUserId)
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await supabase
            .from('valuation_settings')
            .update(payload)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('valuation_settings')
            .insert(payload);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from('valuation_settings')
          .insert(payload);
        if (error) throw error;
      }
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações do lojista:', err);
      return false;
    }
  }
};
