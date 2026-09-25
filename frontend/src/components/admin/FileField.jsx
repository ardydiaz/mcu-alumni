import { useEffect, useId, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { assetUrl } from '../../api/client.js';

// Upload an image/PDF, or paste a URL. `value` is the stored URL; `file` a newly picked File.
export default function FileField({ label, value, file, onUrlChange, onFile, kind = 'image', error, hint, className = '' }) {
  const id = useId();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file || kind !== 'image') return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  const current = preview || assetUrl(value);
  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml' : 'application/pdf';

  return (
    <div className={`field file-field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={`${id}-file`}>{label}</label>
      <div className="file-field__box">
        {kind === 'image' ? (
          <div className="file-field__preview">
            {current ? <img src={current} alt="" /> : <Icon name="building" size={28} />}
          </div>
        ) : (
          <div className="file-field__preview file-field__preview--doc">
            <Icon name="file" size={28} />
          </div>
        )}
        <div className="file-field__controls">
          <input
            id={`${id}-file`}
            type="file"
            accept={accept}
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <small className="field__hint">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB){' '}
              <button type="button" className="link-btn" onClick={() => onFile(null)}>Remove</button>
            </small>
          ) : (
            <>
              <input
                type="text"
                className="file-field__url"
                placeholder={kind === 'image' ? 'or paste an image URL' : 'or paste a PDF URL'}
                value={value ?? ''}
                onChange={(e) => onUrlChange(e.target.value)}
                aria-label={`${label} URL`}
              />
              {value && kind !== 'image' && (
                <a href={assetUrl(value)} target="_blank" rel="noreferrer" className="field__hint">Open current file</a>
              )}
            </>
          )}
        </div>
      </div>
      {error ? <small className="field__error">{error}</small> : hint && <small className="field__hint">{hint}</small>}
    </div>
  );
}
