import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import styles from "./CustomSelect.module.css";

interface Option {
    value: string;
    label: string;
}

interface Props {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
}

export function CustomSelect({ value, options, onChange, placeholder }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    /* close on click outside */
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    /* close on Escape */
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const selected = options.find(o => o.value === value);

    return (
        <div className={styles.wrapper} ref={ref}>
            <button
                type="button"
                className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
                onClick={() => setOpen(!open)}
            >
                <span className={selected ? styles.triggerValue : styles.triggerPlaceholder}>
                    {selected?.label || placeholder || "Seleccionar…"}
                </span>
                <ChevronDown size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
            </button>

            {open && (
                <div className={styles.dropdown}>
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.option} ${opt.value === value ? styles.optionSelected : ""}`}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                        >
                            <span>{opt.label}</span>
                            {opt.value === value && <Check size={14} className={styles.checkIcon} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
