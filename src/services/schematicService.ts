import { supabase } from '@/integrations/supabase/client';

export interface ElectricSchematic {
  id: string;
  title: string;
  brand: string;
  model: string;
  pdfUrl: string;
  fileName?: string;
  fileSize?: string;
  pagesCount?: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export const schematicService = {
  async getSchematics(): Promise<ElectricSchematic[]> {
    const { data, error } = await supabase
      .from('electric_schematics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[schematicService] Erro ao buscar esquemas:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      brand: row.brand,
      model: row.model,
      pdfUrl: row.pdf_url,
      fileName: row.file_name || 'esquema.pdf',
      fileSize: row.file_size || 'PDF',
      pagesCount: row.pages_count || 1,
      description: row.description || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async addSchematic(schematic: {
    title: string;
    brand: string;
    model: string;
    pdfUrl: string;
    fileName?: string;
    fileSize?: string;
    pagesCount?: number;
    description?: string;
  }): Promise<ElectricSchematic | null> {
    const { data, error } = await supabase
      .from('electric_schematics')
      .insert({
        title: schematic.title.trim(),
        brand: schematic.brand.trim(),
        model: schematic.model.trim(),
        pdf_url: schematic.pdfUrl,
        file_name: schematic.fileName || `${schematic.model}_esquema.pdf`,
        file_size: schematic.fileSize || 'PDF',
        pages_count: schematic.pagesCount || 1,
        description: schematic.description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[schematicService] Erro ao cadastrar esquema:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      brand: data.brand,
      model: data.model,
      pdfUrl: data.pdf_url,
      fileName: data.file_name,
      fileSize: data.file_size,
      pagesCount: data.pages_count,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateSchematic(id: string, updates: {
    title?: string;
    brand?: string;
    model?: string;
    pdfUrl?: string;
    fileName?: string;
    fileSize?: string;
    pagesCount?: number;
    description?: string;
  }): Promise<boolean> {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.brand !== undefined) payload.brand = updates.brand.trim();
    if (updates.model !== undefined) payload.model = updates.model.trim();
    if (updates.pdfUrl !== undefined) payload.pdf_url = updates.pdfUrl;
    if (updates.fileName !== undefined) payload.file_name = updates.fileName;
    if (updates.fileSize !== undefined) payload.file_size = updates.fileSize;
    if (updates.pagesCount !== undefined) payload.pages_count = updates.pagesCount;
    if (updates.description !== undefined) payload.description = updates.description.trim();

    const { error } = await supabase
      .from('electric_schematics')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('[schematicService] Erro ao atualizar esquema:', error);
      return false;
    }

    return true;
  },

  async deleteSchematic(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('electric_schematics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[schematicService] Erro ao deletar esquema:', error);
      return false;
    }

    return true;
  }
};
