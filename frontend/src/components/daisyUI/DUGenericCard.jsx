export const DUGenericCard = (content, className = "w-96") => {  
    return (
        <div className={`card bg-base-100 ${className} shadow-sm`}>
            <div className="card-body">
                {content}
            </div>
        </div>
    );
}

export default DUGenericCard;