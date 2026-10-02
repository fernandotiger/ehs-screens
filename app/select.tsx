"use client";

import { Children, Fragment, isValidElement, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; text: string; disabled: boolean };
type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size">;

function textOf(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : String(child)).join("");
}

function optionsOf(children: ReactNode, inheritedDisabled = false): Option[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode; value?: string | number; disabled?: boolean }>(child)) return [];
    if (child.type === Fragment || child.type === "optgroup") return optionsOf(child.props.children, inheritedDisabled || !!child.props.disabled);
    if (child.type !== "option") return [];
    const text = textOf(child.props.children);
    return [{ value: String(child.props.value ?? text), text, disabled: inheritedDisabled || !!child.props.disabled }];
  });
}

/** In-page options avoid the embedded browser's transient native select window. */
export function Select({ children, className = "", style, id, value, defaultValue, disabled, autoFocus, onChange, onInvalid, ...props }: Props) {
  const generatedId = useId();
  const listId = `${generatedId}-options`;
  const options = optionsOf(children);
  const [localValue, setLocalValue] = useState(String(defaultValue ?? options[0]?.value ?? ""));
  const currentValue = value === undefined ? localValue : String(value);
  const selected = options.find(o => o.value === currentValue) ?? options[0];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [label, setLabel] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 280 });
  const wrapper = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", time: 0 });

  useEffect(() => {
    const enclosingLabel = trigger.current?.closest("label");
    if (enclosingLabel) {
      const copy = enclosingLabel.cloneNode(true) as HTMLElement;
      copy.querySelectorAll(".app-select-wrap, input, textarea, button").forEach(el => el.remove());
      setLabel(copy.textContent?.trim() ?? "");
    }
    if (autoFocus) trigger.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = trigger.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const upward = below < 180 && above > below;
      const maxHeight = Math.min(280, Math.max(80, upward ? above : below));
      const height = Math.min(maxHeight, options.length * 38 + 10);
      const width = Math.min(Math.max(r.width, 180), window.innerWidth - 24);
      setPosition({ left: Math.max(12, Math.min(r.left, window.innerWidth - width - 12)), top: upward ? r.top - height - 5 : r.bottom + 5, width, maxHeight });
    };
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const blurWindow = () => setOpen(false);
    place();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.addEventListener("blur", blurWindow);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("blur", blurWindow);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  function show() {
    if (disabled) return;
    const selectedIndex = options.findIndex(o => o.value === currentValue && !o.disabled);
    setActive(selectedIndex < 0 ? Math.max(0, options.findIndex(o => !o.disabled)) : selectedIndex);
    setOpen(true);
    typed.current = { text: "", time: 0 };
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled || !native.current) return;
    // Use the real backing select so existing React handlers and FormData keep working.
    native.current.value = option.value;
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    setInvalid(false);
    setOpen(false);
    trigger.current?.focus();
  }

  function move(direction: number) {
    for (let step = 1; step <= options.length; step++) {
      const next = (active + direction * step + options.length) % options.length;
      if (!options[next].disabled) { setActive(next); return; }
    }
  }

  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key === "Escape") { if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); } return; }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      if (event.key === "Enter" || event.key === " ") choose(active);
      else if (event.key === "Home") setActive(Math.max(0, options.findIndex(o => !o.disabled)));
      else if (event.key === "End") setActive(options.findLastIndex(o => !o.disabled));
      else move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const query = now - typed.current.time > 700 ? event.key : typed.current.text + event.key;
      typed.current = { text: query.toLowerCase(), time: now };
      const search = query.length > 1 && [...query].every(c => c === query[0]) ? query[0] : query;
      const start = open ? active : options.findIndex(o => o.value === currentValue);
      for (let step = 1; step <= options.length; step++) {
        const next = (Math.max(0, start) + step) % options.length;
        if (!options[next].disabled && options[next].text.toLowerCase().startsWith(search.toLowerCase())) {
          if (!open) show();
          setActive(next);
          break;
        }
      }
    }
  }

  return <span ref={wrapper} className="app-select-wrap">
    <select {...props} ref={native} className="app-select-native" value={currentValue} disabled={disabled} tabIndex={-1} aria-hidden="true"
      onChange={event => { setLocalValue(event.target.value); onChange?.(event); }}
      onInvalid={event => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); show(); onInvalid?.(event); }}>
      {children}
    </select>
    <button ref={trigger} id={id} type="button" role="combobox" className={`app-select ${className}`} style={style} disabled={disabled}
      aria-label={props["aria-label"] || label || undefined} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]}
      aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? listId : undefined} aria-required={props.required || undefined}
      aria-invalid={invalid || props["aria-invalid"]} aria-activedescendant={open ? `${listId}-${active}` : undefined}
      onKeyDown={keyboard} onClick={() => open ? setOpen(false) : show()}>
      <span className="app-select-value">{selected?.text || "Choose an option"}</span><ChevronDown size={15} aria-hidden="true" />
    </button>
    {invalid && <span className="app-select-error" role="alert">Choose an option.</span>}
    {open && createPortal(<div ref={menu} id={listId} role="listbox" aria-label={props["aria-label"] || label || "Options"} className="app-select-menu" style={position}>
      {options.map((option, index) => <div key={`${option.value}-${index}`} id={`${listId}-${index}`} role="option" aria-selected={option.value === currentValue} aria-disabled={option.disabled || undefined}
        data-index={index} className={`app-select-option ${index === active ? "highlighted" : ""} ${option.value === currentValue ? "selected" : ""} ${option.disabled ? "disabled" : ""}`}
        onPointerMove={() => { if (!option.disabled) setActive(index); }} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.text}</span>{option.value === currentValue && <Check size={15} aria-hidden="true" />}
      </div>)}
      {!options.length && <div className="app-select-option disabled">No options available</div>}
    </div>, document.body)}
  </span>;
}
