import { ToggleWidget } from "../../types.ts";

export function Toggle({
  label,
  name,
  options,
  disabled,
  value,
  onChange,
}: ToggleWidget) {
  return (
    <>
      <label>{label || name}</label>
      <input
        value={value}
        type="checkbox"
        disabled={disabled}
        onChange={(e) => {
          onChange?.(e);
        }}
      />{" "}
      {value ? options?.on || "true" : options?.off || "false"}
    </>
  );
}