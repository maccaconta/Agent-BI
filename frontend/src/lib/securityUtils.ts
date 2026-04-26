/**
 * frontend/src/lib/securityUtils.ts
 * ────────────────────────────────
 * Utilitários de segurança e anonimização client-side (Guardrail Camada 0).
 */

export const MASK_ID = "***********-**";
export const MASK_NAME = "********";
export const MASK_EMAIL = "********@********.***";
export const MASK_PHONE = "(**) *****-****";

/**
 * Realiza uma anonimização de "melhor esforço" no cliente.
 * Evita que dados sensíveis brutos fiquem no localStorage ou sejam exibidos
 * enquanto o processamento oficial do backend não termina.
 */
export function anonymizeLocalData(
  data: Record<string, any>[], 
  columns: string[],
  piiKeywords: Record<string, string> = {}
): Record<string, any>[] {
  if (!data || data.length === 0) return [];

  // Padrões padrão se não houver dicionário carregado ainda
  const defaultKeywords: Record<string, string> = {
    "cpf": "MASK_ID",
    "cnpj": "MASK_ID",
    "email": "MASK_EMAIL",
    "telefone": "MASK_PHONE",
    "celular": "MASK_PHONE",
    "senha": "REDACTED",
    "password": "REDACTED",
    "nome": "MASK_NAME",
    "nm_": "MASK_NAME",
    "cliente": "MASK_NAME",
    "usr": "MASK_NAME",
    "user": "MASK_NAME"
  };

  const keywords = { ...defaultKeywords, ...piiKeywords };

  return data.map(row => {
    const newRow = { ...row };
    
    columns.forEach(col => {
      const colLower = col.toLowerCase();
      
      // Verifica se a coluna deve ser anonimizada
      const match = Object.keys(keywords).find(k => colLower.includes(k.toLowerCase()));
      
      if (match) {
        const strategy = keywords[match];
        const val = String(newRow[col] || "");
        
        if (!val) return;

        if (strategy === "MASK_NAME") {
          const parts = val.split(" ");
          newRow[col] = parts.map(p => p.length > 2 ? p[0] + p[1] + "**" : p).join(" ");
        } else if (strategy === "MASK_EMAIL") {
          const [user, domain] = val.split("@");
          newRow[col] = (user ? user.substring(0, 2) + "***" : "***") + (domain ? "@" + domain : "");
        } else if (strategy === "MASK_ID") {
          newRow[col] = "***********" + (val.length > 2 ? val.substring(val.length - 3) : "");
        } else if (strategy === "REDACTED") {
          newRow[col] = "[CONFIDENCIAL]";
        } else {
          // Fallback simples
          newRow[col] = "********";
        }
      }
    });
    
    return newRow;
  });
}
