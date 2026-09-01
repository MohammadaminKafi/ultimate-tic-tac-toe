import { Label, Slider } from "@heroui/react";

interface AppSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  output: string;
  tone?: "x" | "o" | "neutral";
  isDisabled?: boolean;
  onChange: (value: number) => void;
}

export function AppSlider({
  label,
  value,
  min,
  max,
  step = 1,
  output,
  tone = "neutral",
  isDisabled = false,
  onChange,
}: AppSliderProps) {
  return (
    <Slider
      className={`app-slider tone-${tone}`}
      value={value}
      minValue={min}
      maxValue={max}
      step={step}
      isDisabled={isDisabled}
      aria-label={label}
      onChange={(next) => onChange(Array.isArray(next) ? (next[0] ?? min) : next)}
    >
      <div className="app-slider__heading">
        <Label>{label}</Label>
        <output>{output}</output>
      </div>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
      <div className="app-slider__bounds" aria-hidden="true"><span>{min}</span><span>{max}</span></div>
    </Slider>
  );
}
