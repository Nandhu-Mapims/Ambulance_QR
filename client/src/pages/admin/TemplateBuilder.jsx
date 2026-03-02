import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import Spinner from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';

/* ── Constants ─────────────────────────────────────────────────────────────── */
const TYPES = ['BLS', 'ALS', 'ICU', 'NEONATAL', 'TRANSPORT'];
const Q_TYPES = ['YESNO', 'TEXT', 'NUMBER', 'DROPDOWN', 'DATE', 'PHOTO'];

const TYPE_META = {
  BLS:       { color: '#2563eb', bg: '#eff6ff', emoji: '🟦', label: 'Basic Life Support' },
  ALS:       { color: '#7c3aed', bg: '#f5f3ff', emoji: '🟣', label: 'Advanced Life Support' },
  ICU:       { color: '#dc2626', bg: '#fef2f2', emoji: '🔴', label: 'Intensive Care Unit' },
  NEONATAL:  { color: '#d97706', bg: '#fffbeb', emoji: '🟡', label: 'Neonatal Transport' },
  TRANSPORT: { color: '#059669', bg: '#f0fdf4', emoji: '🟢', label: 'Patient Transport' },
};

const Q_META = {
  YESNO:    { emoji: '✅', label: 'Yes / No', desc: 'Pass/fail compliance check', color: '#16a34a', bg: '#f0fdf4' },
  TEXT:     { emoji: '✍️', label: 'Text',     desc: 'Free-form text answer',       color: '#2563eb', bg: '#eff6ff' },
  NUMBER:   { emoji: '🔢', label: 'Number',   desc: 'Numeric value input',         color: '#7c3aed', bg: '#f5f3ff' },
  DROPDOWN: { emoji: '📋', label: 'Dropdown', desc: 'Select from a list',          color: '#d97706', bg: '#fffbeb' },
  DATE:     { emoji: '📅', label: 'Date',     desc: 'Date picker input',           color: '#0891b2', bg: '#ecfeff' },
  PHOTO:    { emoji: '📷', label: 'Photo',    desc: 'Upload evidence photo',       color: '#dc2626', bg: '#fef2f2' },
};

/* ── Zod schemas ───────────────────────────────────────────────────────────── */
const questionSchema = z.object({
  key: z.string().min(1, 'Key required').regex(/^[a-z0-9_]+$/, 'Lowercase + underscores only'),
  label: z.string().min(1, 'Question label required'),
  type: z.enum(Q_TYPES, { required_error: 'Select a type' }),
  required: z.boolean().default(true),
  requiresEvidenceIfNo: z.boolean().default(false),
  options: z.string().optional(),
});

const templateSchema = z.object({
  ambulanceType: z.enum(TYPES, { required_error: 'Pick an ambulance type' }),
  name: z.string().min(2, 'Template name required'),
  version: z.coerce.number().int().positive().default(1),
  questions: z.array(questionSchema).min(1, 'Add at least one question'),
});

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP INDICATOR
═══════════════════════════════════════════════════════════════════════════ */
function StepBar({ step, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem' }}>
      {steps.map((s, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              padding: '.45rem .85rem', borderRadius: 99, flexShrink: 0,
              background: current ? '#1d4ed8' : done ? '#f0fdf4' : '#f3f4f6',
              border: `1.5px solid ${current ? '#1d4ed8' : done ? '#16a34a' : '#e5e7eb'}`,
              transition: 'all .25s',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: current ? 'rgba(255,255,255,.25)' : done ? '#16a34a' : '#d1d5db',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.7rem', fontWeight: 900, color: current ? '#fff' : done ? '#fff' : '#6b7280',
              }}>
                {done ? '✓' : i + 1}
              </span>
              <span style={{
                fontSize: '.8rem', fontWeight: 700,
                color: current ? '#fff' : done ? '#16a34a' : '#6b7280',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: done ? '#16a34a' : '#e5e7eb',
                margin: '0 .25rem', transition: 'background .25s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1 — Template Info
═══════════════════════════════════════════════════════════════════════════ */
function Step1({ register, errors, watch, setValue, editTemplate }) {
  const selected = watch('ambulanceType');

  return (
    <div style={{ maxWidth: 680 }}>
      <h5 style={{ fontWeight: 800, marginBottom: '.35rem' }}>Template Info</h5>
      <p style={{ color: '#6b7280', fontSize: '.9rem', marginBottom: '1.75rem' }}>
        Choose the ambulance type this template applies to, then give it a name.
      </p>

      {/* Ambulance type picker */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={{ fontWeight: 700, fontSize: '.85rem', display: 'block', marginBottom: '.65rem' }}>
          Ambulance Type <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '.75rem' }}>
          {TYPES.map((t) => {
            const m = TYPE_META[t];
            const active = selected === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setValue('ambulanceType', t, { shouldValidate: true })}
                style={{
                  padding: '1rem .75rem', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                  background: active ? m.color : m.bg,
                  border: `2px solid ${active ? m.color : 'transparent'}`,
                  boxShadow: active ? `0 4px 16px ${m.color}33` : '0 1px 4px rgba(0,0,0,.06)',
                  transition: 'all .2s', outline: 'none',
                }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: '.35rem' }}>{m.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: '.8rem', color: active ? '#fff' : m.color }}>{t}</div>
                <div style={{ fontSize: '.7rem', color: active ? 'rgba(255,255,255,.8)' : '#9ca3af', marginTop: '.2rem' }}>
                  {m.label}
                </div>
              </button>
            );
          })}
        </div>
        {errors.ambulanceType && (
          <div style={{ color: '#dc2626', fontSize: '.8rem', marginTop: '.5rem' }}>
            {errors.ambulanceType.message}
          </div>
        )}
      </div>

      {/* Name & Version */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ fontWeight: 700, fontSize: '.85rem', display: 'block', marginBottom: '.4rem' }}>
            Template Name <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            placeholder="e.g. BLS Monthly Safety Checklist"
            {...register('name')}
          />
          {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
        </div>
        <div>
          <label style={{ fontWeight: 700, fontSize: '.85rem', display: 'block', marginBottom: '.4rem' }}>
            Version
          </label>
          <input type="number" min="1" className="form-control" {...register('version')} />
          {editTemplate && (
            <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '.3rem' }}>
              Previous: v{editTemplate.version}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2 — Question Builder
═══════════════════════════════════════════════════════════════════════════ */
function QuestionCard({ index, total, field, control, register, remove, move, errors }) {
  const qType = useWatch({ control, name: `questions.${index}.type` });
  const label = useWatch({ control, name: `questions.${index}.label` });
  const err = errors?.questions?.[index];
  const [expanded, setExpanded] = useState(true);
  const m = Q_META[qType] || Q_META.YESNO;

  return (
    <div style={{
      border: `1.5px solid ${expanded ? m.color + '44' : '#e5e7eb'}`,
      borderRadius: 14, marginBottom: '.75rem',
      background: '#fff',
      boxShadow: expanded ? `0 4px 16px ${m.color}11` : '0 1px 4px rgba(0,0,0,.04)',
      transition: 'all .22s',
      overflow: 'hidden',
    }}>
      {/* Card Header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          padding: '.8rem 1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '.75rem',
          background: expanded ? `${m.bg}` : '#fafafa',
          borderBottom: expanded ? `1px solid ${m.color}22` : 'none',
          transition: 'background .2s',
        }}
      >
        {/* Drag handles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <button
            type="button" onClick={(e) => { e.stopPropagation(); move(index, index - 1); }}
            disabled={index === 0}
            style={{
              width: 22, height: 22, borderRadius: 6, border: '1px solid #e5e7eb',
              background: '#f9fafb', cursor: index === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.6rem', color: '#9ca3af', padding: 0, lineHeight: 1,
              opacity: index === 0 ? .4 : 1,
            }}
          >▲</button>
          <button
            type="button" onClick={(e) => { e.stopPropagation(); move(index, index + 1); }}
            disabled={index === total - 1}
            style={{
              width: 22, height: 22, borderRadius: 6, border: '1px solid #e5e7eb',
              background: '#f9fafb', cursor: index === total - 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.6rem', color: '#9ca3af', padding: 0, lineHeight: 1,
              opacity: index === total - 1 ? .4 : 1,
            }}
          >▼</button>
        </div>

        <span style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: m.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '.7rem',
        }}>
          {index + 1}
        </span>

        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{m.emoji}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '.875rem', color: label ? '#111' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label || 'Untitled question…'}
          </div>
          <div style={{ fontSize: '.72rem', color: m.color, fontWeight: 600 }}>{m.label}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(index); }}
            style={{
              padding: '.2rem .5rem', borderRadius: 6, border: '1px solid #fca5a5',
              background: '#fef2f2', color: '#dc2626', fontSize: '.72rem',
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            ✕
          </button>
          <span style={{ color: '#9ca3af', fontSize: '.8rem' }}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '.75rem', marginBottom: '.75rem' }}>
            {/* Key */}
            <div>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>
                Field Key <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control form-control-sm ${err?.key ? 'is-invalid' : ''}`}
                placeholder="e.g. oxygen_level"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}
                {...register(`questions.${index}.key`)}
              />
              {err?.key && <div className="invalid-feedback" style={{ fontSize: '.72rem' }}>{err.key.message}</div>}
              <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: '.2rem' }}>Lowercase + underscores</div>
            </div>
            {/* Type picker */}
            <div>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>
                Question Type <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                {Q_TYPES.map((t) => {
                  const tm = Q_META[t];
                  const active = qType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        /* manually set value via register path */
                        const input = document.querySelector(`[name="questions.${index}.type"]`);
                        if (input) { input.value = t; input.dispatchEvent(new Event('change', { bubbles: true })); }
                      }}
                      title={tm.desc}
                      style={{
                        padding: '.22rem .55rem', borderRadius: 7,
                        border: `1.5px solid ${active ? tm.color : '#e5e7eb'}`,
                        background: active ? tm.color : '#f9fafb',
                        color: active ? '#fff' : '#374151',
                        fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
                        transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '.25rem',
                      }}
                    >
                      <span>{tm.emoji}</span> {t}
                    </button>
                  );
                })}
              </div>
              <select
                style={{ display: 'none' }}
                {...register(`questions.${index}.type`)}
              >
                {Q_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {err?.type && <div style={{ color: '#dc2626', fontSize: '.72rem', marginTop: '.25rem' }}>{err.type.message}</div>}
            </div>
          </div>

          {/* Label */}
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>
              Question Label <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className={`form-control form-control-sm ${err?.label ? 'is-invalid' : ''}`}
              placeholder="Question displayed to the EMT during audit…"
              {...register(`questions.${index}.label`)}
            />
            {err?.label && <div className="invalid-feedback" style={{ fontSize: '.72rem' }}>{err.label.message}</div>}
          </div>

          {/* Dropdown options */}
          {qType === 'DROPDOWN' && (
            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.3rem' }}>
                Dropdown Options
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Option 1, Option 2, Option 3"
                {...register(`questions.${index}.options`)}
              />
              <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: '.2rem' }}>Separate each option with a comma</div>
            </div>
          )}

          {/* Flags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              padding: '.3rem .7rem', borderRadius: 8,
              background: '#f3f4f6', border: '1px solid #e5e7eb',
              cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, userSelect: 'none',
            }}>
              <input type="checkbox" className="form-check-input m-0" {...register(`questions.${index}.required`)} />
              Required question
            </label>

            {qType === 'YESNO' && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                padding: '.3rem .7rem', borderRadius: 8,
                background: '#fff7ed', border: '1px solid #fed7aa',
                cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, userSelect: 'none',
              }}>
                <input type="checkbox" className="form-check-input m-0" {...register(`questions.${index}.requiresEvidenceIfNo`)} />
                📷 Require evidence if NO
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Step2({ fields, control, register, errors, append, remove, move }) {
  const addQuestion = (type) => {
    append({ key: '', label: '', type, required: true, requiresEvidenceIfNo: false, options: '' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h5 style={{ fontWeight: 800, marginBottom: '.25rem' }}>Build Questions</h5>
          <p style={{ color: '#6b7280', fontSize: '.9rem', margin: 0 }}>
            Add and arrange checklist items. <strong>{fields.length}</strong> question{fields.length !== 1 ? 's' : ''} so far.
          </p>
        </div>
      </div>

      {/* Quick-add type buttons */}
      <div style={{
        background: '#f8fafc', border: '1.5px dashed #cbd5e1',
        borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem',
      }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#6b7280', marginBottom: '.6rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Quick Add
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {Q_TYPES.map((t) => {
            const m = Q_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => addQuestion(t)}
                style={{
                  padding: '.4rem .9rem', borderRadius: 10,
                  border: `1.5px solid ${m.color}55`,
                  background: m.bg, color: m.color,
                  fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                  transition: 'all .18s', display: 'flex', alignItems: 'center', gap: '.35rem',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = m.color; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = m.bg; e.currentTarget.style.color = m.color; }}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {errors.questions?.message && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '.6rem 1rem', color: '#dc2626', fontSize: '.85rem', marginBottom: '1rem',
        }}>
          ⚠ {errors.questions.message}
        </div>
      )}

      {fields.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1rem',
          background: '#f8fafc', borderRadius: 14, border: '1.5px dashed #e2e8f0',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📋</div>
          <p style={{ color: '#9ca3af', fontWeight: 600 }}>No questions yet. Use Quick Add above to start.</p>
        </div>
      ) : (
        fields.map((field, index) => (
          <QuestionCard
            key={field.id}
            index={index}
            total={fields.length}
            field={field}
            control={control}
            register={register}
            errors={errors}
            remove={remove}
            move={move}
          />
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 3 — Review & Publish (Live EMT Preview)
═══════════════════════════════════════════════════════════════════════════ */
function Step3({ watch }) {
  const data = watch();
  const { ambulanceType, name, version, questions = [] } = data;
  const tm = TYPE_META[ambulanceType] || {};
  const yesno = questions.filter((q) => q.type === 'YESNO').length;
  const required = questions.filter((q) => q.required).length;
  const evidence = questions.filter((q) => q.requiresEvidenceIfNo).length;

  return (
    <div>
      <h5 style={{ fontWeight: 800, marginBottom: '.35rem' }}>Review & Publish</h5>
      <p style={{ color: '#6b7280', fontSize: '.9rem', marginBottom: '1.75rem' }}>
        Preview how EMTs will see this checklist. Confirm details then save.
      </p>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Questions', value: questions.length, color: '#2563eb', bg: '#eff6ff', emoji: '❓' },
          { label: 'Required',        value: required,         color: '#16a34a', bg: '#f0fdf4', emoji: '⚡' },
          { label: 'Yes/No',          value: yesno,            color: '#7c3aed', bg: '#f5f3ff', emoji: '✅' },
          { label: 'Need Evidence',   value: evidence,         color: '#d97706', bg: '#fffbeb', emoji: '📷' },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, border: `1.5px solid ${s.color}33`,
            borderRadius: 12, padding: '.85rem 1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem' }}>{s.emoji}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '.73rem', color: '#6b7280', fontWeight: 600, marginTop: '.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Template meta */}
      <div style={{
        background: tm.bg || '#f3f4f6', border: `1.5px solid ${tm.color || '#e5e7eb'}33`,
        borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <span style={{ fontSize: '2rem' }}>{tm.emoji || '📋'}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>{name || '—'}</div>
          <div style={{ fontSize: '.8rem', color: '#6b7280' }}>
            Type: <strong style={{ color: tm.color }}>{ambulanceType || '—'}</strong>
            &nbsp;·&nbsp; Version: <strong>v{version}</strong>
          </div>
        </div>
      </div>

      {/* EMT mockup */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: -12, left: 16,
          background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
          color: '#fff', padding: '.15rem .75rem',
          borderRadius: 99, fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em',
          textTransform: 'uppercase', zIndex: 2,
          boxShadow: '0 3px 10px rgba(29,78,216,.35)',
        }}>
          📋 EMT Preview
        </div>
        <div style={{
          border: '2px solid #e5e7eb', borderRadius: 16, padding: '1.5rem 1.25rem',
          background: '#fafafa',
        }}>
          {questions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', margin: 0 }}>No questions added yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {questions.map((q, i) => {
                const qm = Q_META[q.type] || Q_META.YESNO;
                return (
                  <div key={q.key || i} style={{
                    background: '#fff', border: '1.5px solid #e5e7eb',
                    borderRadius: 12, padding: '1rem 1.25rem',
                    borderLeft: `4px solid ${qm.color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: qm.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.68rem', fontWeight: 900, flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '.75rem', fontWeight: 700, color: qm.color }}>{qm.emoji} {q.type}</span>
                      {q.required && (
                        <span style={{ fontSize: '.68rem', color: '#dc2626', fontWeight: 700, marginLeft: 'auto' }}>* Required</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#111', marginBottom: '.5rem' }}>
                      {q.label || <em style={{ color: '#9ca3af' }}>Question label…</em>}
                    </div>
                    {/* Mock answer input */}
                    {q.type === 'YESNO' && (
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <span style={{ padding: '.25rem .9rem', borderRadius: 8, border: '1.5px solid #16a34a', color: '#16a34a', fontSize: '.8rem', fontWeight: 700, background: '#f0fdf4' }}>YES</span>
                        <span style={{ padding: '.25rem .9rem', borderRadius: 8, border: '1.5px solid #e5e7eb', color: '#6b7280', fontSize: '.8rem', fontWeight: 700 }}>NO</span>
                        {q.requiresEvidenceIfNo && <span style={{ fontSize: '.72rem', color: '#d97706', alignSelf: 'center' }}>📷 photo required if NO</span>}
                      </div>
                    )}
                    {q.type === 'TEXT' && (
                      <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.8rem', color: '#9ca3af' }}>Type answer here…</div>
                    )}
                    {q.type === 'NUMBER' && (
                      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.8rem', color: '#9ca3af', width: 80 }}>0</div>
                      </div>
                    )}
                    {q.type === 'DROPDOWN' && (
                      <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.8rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{q.options ? q.options.split(',')[0].trim() : 'Select option…'}</span>
                        <span>▾</span>
                      </div>
                    )}
                    {q.type === 'DATE' && (
                      <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.8rem', color: '#9ca3af' }}>📅 Select date…</div>
                    )}
                    {q.type === 'PHOTO' && (
                      <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '.65rem .75rem', fontSize: '.8rem', color: '#9ca3af', textAlign: 'center', border: '1.5px dashed #d1d5db' }}>
                        📷 Tap to upload photo
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WIZARD SHELL
═══════════════════════════════════════════════════════════════════════════ */
const STEPS = [
  { label: 'Template Info' },
  { label: 'Build Questions' },
  { label: 'Review & Publish' },
];

function TemplateWizard({ editTemplate, onSuccess, onCancel }) {
  const toast = useToast();
  const [step, setStep] = useState(0);

  const { register, control, handleSubmit, watch, setValue, trigger, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: editTemplate
      ? {
          ambulanceType: editTemplate.ambulanceType,
          name: editTemplate.name,
          version: editTemplate.version + 1,
          questions: editTemplate.questions.map((q) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options.join(', ') : q.options || '',
          })),
        }
      : {
          version: 1,
          questions: [{ key: '', label: '', type: 'YESNO', required: true, requiresEvidenceIfNo: false }],
        },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'questions' });

  const goNext = async () => {
    const fields1 = ['ambulanceType', 'name', 'version'];
    const fields2 = ['questions'];
    const valid = await trigger(step === 0 ? fields1 : fields2);
    if (valid) setStep((s) => Math.min(s + 1, 2));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data) => {
    try {
      const questions = data.questions.map((q, i) => ({
        key: q.key.trim(),
        label: q.label.trim(),
        type: q.type,
        required: q.required,
        requiresEvidenceIfNo: q.requiresEvidenceIfNo || false,
        options: q.type === 'DROPDOWN' && q.options
          ? q.options.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        order: i,
      }));

      if (editTemplate) {
        await api.put(`/templates/${editTemplate._id}`, { ...data, questions });
        toast('Template updated successfully', 'success');
      } else {
        await api.post('/templates', { ...data, questions });
        toast('Template created!', 'success');
      }
      reset();
      onSuccess();
    } catch (e) {
      toast(e.response?.data?.message || 'Save failed', 'error');
    }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: '1.5px solid #e5e7eb',
      boxShadow: '0 8px 40px rgba(0,0,0,.08)',
      marginBottom: '2rem', overflow: 'hidden',
    }}>
      {/* Wizard header */}
      <div style={{
        padding: '1.25rem 1.75rem',
        background: 'linear-gradient(135deg, #0c1445, #1d4ed8)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.2rem' }}>
            {editTemplate ? 'Edit Template' : 'New Template'}
          </div>
          <h5 style={{ color: '#fff', fontWeight: 900, margin: 0, letterSpacing: '-.03em' }}>
            Checklist Template Builder
          </h5>
        </div>
        <button
          type="button" onClick={onCancel}
          style={{
            background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
            color: 'rgba(255,255,255,.7)', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1rem',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '1.75rem' }}>
        <StepBar step={step} steps={STEPS} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {step === 0 && (
            <Step1 register={register} errors={errors} watch={watch} setValue={setValue} editTemplate={editTemplate} />
          )}
          {step === 1 && (
            <Step2 fields={fields} control={control} register={register} errors={errors} append={append} remove={remove} move={move} />
          )}
          {step === 2 && (
            <Step3 watch={watch} />
          )}

          {/* Footer actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6',
          }}>
            <button
              type="button" onClick={step === 0 ? onCancel : goPrev}
              style={{
                padding: '.55rem 1.25rem', borderRadius: 10,
                border: '1.5px solid #e5e7eb', background: '#fff',
                fontWeight: 700, fontSize: '.875rem', cursor: 'pointer', color: '#374151',
              }}
            >
              {step === 0 ? '✕ Cancel' : '← Back'}
            </button>

            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              {/* Step dots */}
              <div style={{ display: 'flex', gap: '.35rem' }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: i === step ? 18 : 7, height: 7, borderRadius: 99,
                    background: i === step ? '#1d4ed8' : i < step ? '#16a34a' : '#e5e7eb',
                    transition: 'all .25s',
                  }} />
                ))}
              </div>

              {step < 2 ? (
                <button
                  type="button" onClick={goNext}
                  style={{
                    padding: '.55rem 1.5rem', borderRadius: 10,
                    background: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
                    border: 'none', color: '#fff',
                    fontWeight: 700, fontSize: '.875rem', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(29,78,216,.35)',
                  }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit" disabled={isSubmitting}
                  style={{
                    padding: '.55rem 1.75rem', borderRadius: 10,
                    background: isSubmitting ? '#9ca3af' : '#16a34a',
                    border: 'none', color: '#fff',
                    fontWeight: 700, fontSize: '.875rem', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '.5rem',
                    boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(22,163,74,.35)',
                  }}
                >
                  {isSubmitting && <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />}
                  {editTemplate ? '💾 Save Changes' : '🚀 Publish Template'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE CARD (existing templates list)
═══════════════════════════════════════════════════════════════════════════ */
function TemplateCard({ tpl, onActivate, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const m = TYPE_META[tpl.ambulanceType] || {};

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `1.5px solid ${tpl.isActive ? m.color + '44' : '#e5e7eb'}`,
      boxShadow: tpl.isActive ? `0 4px 20px ${m.color || '#000'}1a` : '0 1px 6px rgba(0,0,0,.05)',
      marginBottom: '.75rem', overflow: 'hidden', transition: 'all .22s',
    }}>
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Type badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: m.bg || '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', border: `1.5px solid ${m.color || '#e5e7eb'}33`,
        }}>
          {m.emoji || '📋'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '.95rem', color: '#111' }}>{tpl.name}</span>
            {tpl.isActive && (
              <span style={{
                background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a',
                fontSize: '.68rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: 99,
              }}>
                ● Active
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            <span style={{ background: m.bg, color: m.color, fontWeight: 700, fontSize: '.72rem', padding: '.12rem .5rem', borderRadius: 99, border: `1px solid ${m.color}33` }}>
              {tpl.ambulanceType}
            </span>
            <span style={{ background: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: '.72rem', padding: '.12rem .5rem', borderRadius: 99 }}>
              v{tpl.version}
            </span>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '.72rem', padding: '.12rem .5rem', borderRadius: 99 }}>
              {tpl.questions?.length} questions
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: '.35rem .75rem', borderRadius: 8, border: '1.5px solid #e5e7eb',
              background: '#f9fafb', fontWeight: 700, fontSize: '.78rem',
              cursor: 'pointer', color: '#374151',
            }}
          >
            {expanded ? '▲ Hide' : '▼ Preview'}
          </button>
          <button
            onClick={() => onEdit(tpl)}
            style={{
              padding: '.35rem .75rem', borderRadius: 8, border: '1.5px solid #dbeafe',
              background: '#eff6ff', fontWeight: 700, fontSize: '.78rem',
              cursor: 'pointer', color: '#2563eb',
            }}
          >
            ✏️ Edit
          </button>
          {!tpl.isActive && (
            <button
              onClick={() => onActivate(tpl._id)}
              style={{
                padding: '.35rem .75rem', borderRadius: 8, border: '1.5px solid #86efac',
                background: '#f0fdf4', fontWeight: 700, fontSize: '.78rem',
                cursor: 'pointer', color: '#16a34a',
              }}
            >
              ✓ Activate
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '1rem 1.25rem', background: '#fafafa' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '.5rem' }}>
            {tpl.questions?.map((q, i) => {
              const qm = Q_META[q.type] || Q_META.YESNO;
              return (
                <div key={q.key} style={{
                  background: '#fff', border: '1.5px solid #e5e7eb',
                  borderRadius: 10, padding: '.6rem .85rem',
                  display: 'flex', alignItems: 'flex-start', gap: '.5rem',
                  borderLeft: `3px solid ${qm.color}`,
                }}>
                  <span style={{ fontWeight: 800, fontSize: '.7rem', color: '#9ca3af', flexShrink: 0, marginTop: '.1rem' }}>#{i + 1}</span>
                  <span style={{ fontSize: '.9rem', flexShrink: 0 }}>{qm.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.82rem', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.label}
                    </div>
                    <div style={{ fontSize: '.7rem', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginTop: '.1rem' }}>
                      {q.key}
                      {q.required && <span style={{ color: '#dc2626', marginLeft: '.25rem' }}>*</span>}
                      {q.requiresEvidenceIfNo && <span style={{ color: '#d97706', marginLeft: '.3rem' }}>📷</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function TemplateBuilder() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTemplates = useCallback(() =>
    api.get('/templates')
      .then(({ data }) => setTemplates(data.templates))
      .catch((e) => toast(e.response?.data?.message || 'Failed to load templates', 'error'))
      .finally(() => setLoading(false)),
  [toast]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleActivate = async (id) => {
    try {
      await api.post(`/templates/${id}/activate`);
      toast('Template activated', 'success');
      await fetchTemplates();
    } catch (e) {
      toast(e.response?.data?.message || 'Activation failed', 'error');
    }
  };

  const handleEdit = (tpl) => {
    setEditTemplate(tpl);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditTemplate(null);
    await fetchTemplates();
  };

  const filtered = typeFilter ? templates.filter((t) => t.ambulanceType === typeFilter) : templates;

  return (
    <div>
      {/* Page banner */}
      <div className="page-banner anim-fade-up" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="section-label mb-1" style={{ color: 'rgba(255,255,255,.7)' }}>Administration</p>
            <h2 style={{ fontWeight: 900, letterSpacing: '-.04em', margin: 0 }}>Checklist Templates</h2>
            <p style={{ margin: '.25rem 0 0', opacity: .85, fontSize: '.9rem' }}>Build and manage audit checklists per ambulance type</p>
          </div>
          {!showForm && (
            <button
              className="btn-hero"
              onClick={() => { setEditTemplate(null); setShowForm(true); }}
              style={{ background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.35)', boxShadow: 'none' }}
            >
              + New Template
            </button>
          )}
        </div>
      </div>

      {/* Status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {TYPES.map((type, i) => {
          const active = templates.find((t) => t.ambulanceType === type && t.isActive);
          const m = TYPE_META[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              style={{
                textAlign: 'center', padding: '.85rem .5rem', borderRadius: 14, cursor: 'pointer',
                background: typeFilter === type ? m.color : active ? m.bg : '#f9fafb',
                border: `2px solid ${typeFilter === type ? m.color : active ? m.color + '44' : '#e5e7eb'}`,
                transition: 'all .2s', outline: 'none',
                boxShadow: typeFilter === type ? `0 4px 14px ${m.color}33` : 'none',
              }}
            >
              <div style={{ fontSize: '1.3rem', marginBottom: '.2rem' }}>{m.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: '.8rem', color: typeFilter === type ? '#fff' : active ? m.color : '#9ca3af' }}>{type}</div>
              <div style={{ fontSize: '.68rem', marginTop: '.15rem', color: typeFilter === type ? 'rgba(255,255,255,.8)' : active ? m.color : '#d1d5db' }}>
                {active ? `v${active.version} ✓` : 'no template'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Wizard */}
      {showForm && (
        <TemplateWizard
          editTemplate={editTemplate}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditTemplate(null); }}
        />
      )}

      {/* Templates list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h6 style={{ fontWeight: 800, margin: 0, fontSize: '.95rem' }}>
          {typeFilter ? `${typeFilter} Templates` : 'All Templates'}
          <span style={{
            background: '#f3f4f6', color: '#374151', marginLeft: '.5rem',
            padding: '.12rem .55rem', borderRadius: 99, fontSize: '.75rem',
          }}>
            {filtered.length}
          </span>
        </h6>
        {typeFilter && (
          <button
            onClick={() => setTypeFilter('')}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '.8rem', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {loading ? <Spinner /> : (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>{typeFilter ? `No ${typeFilter} templates yet.` : 'No templates yet. Create one above.'}</p>
          </div>
        ) : (
          filtered.map((t) => (
            <TemplateCard key={t._id} tpl={t} onActivate={handleActivate} onEdit={handleEdit} />
          ))
        )
      )}
    </div>
  );
}
