export const DUTextInput = (type, placeholder, label, className, id, value, onChange = null) => {  
    return (
        <div className={String(className)}>
            <label className="input">
                <span className="label">{String(label)}</span>
                <input type={String(type)} placeholder={String(placeholder)} id={String(id)} value={value} onChange={onChange}/>
            </label>
        </div>
    );
}

