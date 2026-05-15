const tips = [
  { icon: "%", title: "Promociones", description: "Creá descuentos atractivos para tus clientes." },
  { icon: "📷", title: "Fotos de calidad", description: "Subí fotos nítidas y atractivas de tus productos." },
];

function TipsPanel() {
  return (
    <div className="tips-panel">
      <h3>Consejos para aumentar ventas</h3>
      {tips.map((tip) => (
        <div className="tip-item" key={tip.title}>
          <div className="tip-icon">{tip.icon}</div>
          <div className="tip-content">
            <h4>{tip.title}</h4>
            <p>{tip.description}</p>
            <a href="/" className="card-link">Ir →</a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TipsPanel;