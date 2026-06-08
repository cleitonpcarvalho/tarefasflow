-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE _migrations ENABLE ROW LEVEL SECURITY;

-- Permitir acesso total apenas para service_role (usado pelo backend)
CREATE POLICY "service_role_all" ON users TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON tasks TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON reminders TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON whatsapp_instances TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON authorized_numbers TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON whatsapp_logs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON whatsapp_conversation_context TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON _migrations TO service_role USING (true) WITH CHECK (true);
