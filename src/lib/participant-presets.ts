export interface ParticipantPreset {
  value: string;
  label: string;
  roleLabel: string | null;
  shareWeight: number;
}

export const PARTICIPANT_PRESETS: ParticipantPreset[] = [
  { value: "normal", label: "Participante — paga su parte", roleLabel: null, shareWeight: 1 },
  { value: "mitad", label: "Paga la mitad", roleLabel: null, shareWeight: 0.5 },
  { value: "doble", label: "Paga el doble (ej. pareja)", roleLabel: null, shareWeight: 2 },
  {
    value: "homenajeado",
    label: "Homenajeado/a — no paga",
    roleLabel: "Homenajeado",
    shareWeight: 0,
  },
  {
    value: "invitado",
    label: "Invitado especial — no paga",
    roleLabel: "Invitado",
    shareWeight: 0,
  },
];

export function presetFor(roleLabel: string | null, shareWeight: number): string {
  const match = PARTICIPANT_PRESETS.find(
    (p) => p.roleLabel === roleLabel && p.shareWeight === shareWeight
  );
  return match?.value ?? "normal";
}

export function resolvePreset(value: string): { roleLabel: string | null; shareWeight: number } {
  const preset = PARTICIPANT_PRESETS.find((p) => p.value === value);
  return preset
    ? { roleLabel: preset.roleLabel, shareWeight: preset.shareWeight }
    : { roleLabel: null, shareWeight: 1 };
}
