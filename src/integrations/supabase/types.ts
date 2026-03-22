export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      combustivel_carga: {
        Row: {
          created_at: string
          fornecedor_id: string
          fornecedor_nome: string
          id: string
          litros: number
          nota_fiscal: string
        }
        Insert: {
          created_at?: string
          fornecedor_id?: string
          fornecedor_nome?: string
          id?: string
          litros?: number
          nota_fiscal?: string
        }
        Update: {
          created_at?: string
          fornecedor_id?: string
          fornecedor_nome?: string
          id?: string
          litros?: number
          nota_fiscal?: string
        }
        Relationships: []
      }
      combustivel_fechamento: {
        Row: {
          consumo: number
          created_at: string
          data: string
          id: string
          leitura_final: number
          leitura_inicial: number
        }
        Insert: {
          consumo?: number
          created_at?: string
          data: string
          id?: string
          leitura_final?: number
          leitura_inicial?: number
        }
        Update: {
          consumo?: number
          created_at?: string
          data?: string
          id?: string
          leitura_final?: number
          leitura_inicial?: number
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          cidade_estado: string
          cnpj_cpf: string
          created_at: string
          id: string
          observacoes: string
          razao_social: string
          telefone: string
          tipo: string
        }
        Insert: {
          cidade_estado?: string
          cnpj_cpf?: string
          created_at?: string
          id?: string
          observacoes?: string
          razao_social: string
          telefone?: string
          tipo?: string
        }
        Update: {
          cidade_estado?: string
          cnpj_cpf?: string
          created_at?: string
          id?: string
          observacoes?: string
          razao_social?: string
          telefone?: string
          tipo?: string
        }
        Relationships: []
      }
      patio: {
        Row: {
          concluido: boolean
          created_at: string
          eixo: string
          estado: string
          frota: string
          id: string
          local: string
          modelo: string
          placa: string
          status: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          eixo?: string
          estado?: string
          frota?: string
          id?: string
          local?: string
          modelo?: string
          placa: string
          status?: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          eixo?: string
          estado?: string
          frota?: string
          id?: string
          local?: string
          modelo?: string
          placa?: string
          status?: string
        }
        Relationships: []
      }
      pneu_inventario: {
        Row: {
          aro: string
          created_at: string
          fornecedor_id: string
          fornecedor_nome: string
          id: string
          largura: string
          marca: string
          num_fogo: string
          status: string
          tamanho: string
        }
        Insert: {
          aro?: string
          created_at?: string
          fornecedor_id?: string
          fornecedor_nome?: string
          id?: string
          largura?: string
          marca?: string
          num_fogo?: string
          status?: string
          tamanho?: string
        }
        Update: {
          aro?: string
          created_at?: string
          fornecedor_id?: string
          fornecedor_nome?: string
          id?: string
          largura?: string
          marca?: string
          num_fogo?: string
          status?: string
          tamanho?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          login: string
          nivel: string
          nome: string
          pode_combustivel: boolean
          pode_excel: boolean
          pode_expedicao: boolean
          pode_fornecedores: boolean
          pode_inventario: boolean
          pode_patio: boolean
          pode_pdf: boolean
          pode_rodizio: boolean
          senha: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          login: string
          nivel?: string
          nome: string
          pode_combustivel?: boolean
          pode_excel?: boolean
          pode_expedicao?: boolean
          pode_fornecedores?: boolean
          pode_inventario?: boolean
          pode_patio?: boolean
          pode_pdf?: boolean
          pode_rodizio?: boolean
          senha?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          login?: string
          nivel?: string
          nome?: string
          pode_combustivel?: boolean
          pode_excel?: boolean
          pode_expedicao?: boolean
          pode_fornecedores?: boolean
          pode_inventario?: boolean
          pode_patio?: boolean
          pode_pdf?: boolean
          pode_rodizio?: boolean
          senha?: string
        }
        Relationships: []
      }
      rodizio: {
        Row: {
          created_at: string
          frota: string
          id: string
          lacre: string
          num_fogo: string
          placa: string
          posicao: string
          sulco: string
          tipo: string
        }
        Insert: {
          created_at?: string
          frota?: string
          id?: string
          lacre?: string
          num_fogo?: string
          placa: string
          posicao?: string
          sulco?: string
          tipo?: string
        }
        Update: {
          created_at?: string
          frota?: string
          id?: string
          lacre?: string
          num_fogo?: string
          placa?: string
          posicao?: string
          sulco?: string
          tipo?: string
        }
        Relationships: []
      }
      servicos_internos: {
        Row: {
          created_at: string
          descricao: string
          frota: string
          id: string
          item_peca: string
          mecanico: string
          placa: string
          quantidade: number
          status: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          frota?: string
          id?: string
          item_peca?: string
          mecanico?: string
          placa?: string
          quantidade?: number
          status?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          frota?: string
          id?: string
          item_peca?: string
          mecanico?: string
          placa?: string
          quantidade?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      list_users_safe: { Args: never; Returns: Json[] }
      verify_login: {
        Args: { p_login: string; p_senha: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
