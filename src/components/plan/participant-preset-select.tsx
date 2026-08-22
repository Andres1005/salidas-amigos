"use client";

import { Select } from "@/components/ui/field";
import { PARTICIPANT_PRESETS } from "@/lib/participant-presets";

export function ParticipantPresetSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <Select
      name="preset"
      defaultValue={defaultValue}
      className="h-9 w-auto text-xs"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {PARTICIPANT_PRESETS.map((preset) => (
        <option key={preset.value} value={preset.value}>
          {preset.label}
        </option>
      ))}
    </Select>
  );
}
