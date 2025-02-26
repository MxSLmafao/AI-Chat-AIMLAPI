import modelsData from "../../../attached_assets/names.json";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export function getAvailableModels(): ModelOption[] {
  const models: ModelOption[] = [];
  
  Object.entries(modelsData).forEach(([provider, providerModels]) => {
    Object.entries(providerModels as Record<string, string>).forEach(([id, name]) => {
      models.push({
        id,
        name,
        provider
      });
    });
  });

  return models.sort((a, b) => a.name.localeCompare(b.name));
}
