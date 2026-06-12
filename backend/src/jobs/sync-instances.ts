import { sql } from "../config/db";
import {
  EvolutionServiceError,
  getConnectionState,
  type EvolutionConnectionState
} from "../services/evolution.service";
import { updateWhatsappInstanceStatus } from "../services/whatsapp-instance.service";

interface InstanceToSynchronize {
  instance_name: string;
  status: EvolutionConnectionState;
  user_id: string;
}

export async function synchronizeInstances() {
  const instances = await sql<InstanceToSynchronize[]>`
    SELECT instance_name, status, user_id
    FROM whatsapp_instances
    WHERE status != 'close'
  `;
  let updated = 0;
  let errors = 0;

  for (const instance of instances) {
    try {
      const connection = await getConnectionState(instance.instance_name);
      await updateWhatsappInstanceStatus(
        instance.instance_name,
        connection.state
      );
      updated += 1;
    } catch (error) {
      if (
        error instanceof EvolutionServiceError &&
        error.statusCode === 404
      ) {
        try {
          await updateWhatsappInstanceStatus(instance.instance_name, "close");
          updated += 1;
        } catch (updateError) {
          errors += 1;
          console.error(
            `[sync-instances] Erro ao fechar ${instance.instance_name}:`,
            updateError
          );
        }
        continue;
      }

      errors += 1;
      console.error(
        `[sync-instances] Erro ao verificar ${instance.instance_name}:`,
        error
      );
    }
  }

  console.log(
    `[sync-instances] ${instances.length} instâncias verificadas, ${updated} atualizadas, ${errors} erros.`
  );
}
