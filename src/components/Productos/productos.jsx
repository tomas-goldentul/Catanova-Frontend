import { useState } from "react";
import {
  getProductosActivos,
  getTodosLosProductos,
  insertProducto,
  updateEstadoProducto,
  actualizarProducto,
}  from "../../api/productos";

function ResultBox({ result, error, loading }) {
  if (loading) return <div className="prod-result loading">Cargando…</div>;
  if (error) return <div className="prod-result error">⚠ {error}</div>;
  if (result === null) return null;
  return (
    <pre className="prod-result success">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

function useRequest() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async (fn) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fn();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { result, error, loading, run };
}

// ── secciones ─────────────────────────────────────────────────────────────────
function SeccionGetActivos() {
  const { result, error, loading, run } = useRequest();
  return (
    <div className="prod-card">
      <div className="prod-card-header">
        <span className="method get">GET</span>
        <code>/productos/</code>
        <span className="prod-card-desc">Productos activos</span>
      </div>
      <button className="prod-btn" onClick={() => run(getProductosActivos)}>
        Ejecutar
      </button>
      <ResultBox result={result} error={error} loading={loading} />
    </div>
  );
}

function SeccionGetTodos() {
  const { result, error, loading, run } = useRequest();
  return (
    <div className="prod-card">
      <div className="prod-card-header">
        <span className="method get">GET</span>
        <code>/productos/all</code>
        <span className="prod-card-desc">Todos los productos</span>
      </div>
      <button className="prod-btn" onClick={() => run(getTodosLosProductos)}>
        Ejecutar
      </button>
      <ResultBox result={result} error={error} loading={loading} />
    </div>
  );
}

function SeccionInsert() {
  const { result, error, loading, run } = useRequest();
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "" });

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="prod-card">
      <div className="prod-card-header">
        <span className="method post">POST</span>
        <code>/productos/insert</code>
        <span className="prod-card-desc">Agregar producto</span>
      </div>
      <div className="prod-fields">
        <input
          name="nombre"
          placeholder="Nombre *"
          value={form.nombre}
          onChange={handle}
        />
        <input
          name="descripcion"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={handle}
        />
        <input
          name="precio"
          placeholder="Precio"
          type="number"
          value={form.precio}
          onChange={handle}
        />
      </div>
      <button
        className="prod-btn"
        onClick={() =>
          run(() =>
            insertProducto({
              nombre: form.nombre,
              descripcion: form.descripcion || undefined,
              precio: form.precio ? Number(form.precio) : undefined,
            })
          )
        }
      >
        Insertar
      </button>
      <ResultBox result={result} error={error} loading={loading} />
    </div>
  );
}

function SeccionEstado() {
  const { result, error, loading, run } = useRequest();
  const [id, setId] = useState("");
  const [estado, setEstado] = useState(true);

  return (
    <div className="prod-card">
      <div className="prod-card-header">
        <span className="method put">PUT</span>
        <code>/productos/estado/:id</code>
        <span className="prod-card-desc">Cambiar estado</span>
      </div>
      <div className="prod-fields">
        <input
          placeholder="ID del producto"
          value={id}
          onChange={(e) => setId(e.target.value)}
          type="number"
        />
        <div className="prod-toggle-row">
          <span>Estado:</span>
          <button
            type="button"
            className={`prod-toggle ${estado ? "active" : ""}`}
            onClick={() => setEstado(true)}
          >
            Activo
          </button>
          <button
            type="button"
            className={`prod-toggle ${!estado ? "active" : ""}`}
            onClick={() => setEstado(false)}
          >
            Inactivo
          </button>
        </div>
      </div>
      <button
        className="prod-btn"
        onClick={() => run(() => updateEstadoProducto(id, estado))}
      >
        Actualizar estado
      </button>
      <ResultBox result={result} error={error} loading={loading} />
    </div>
  );
}

function SeccionActualizar() {
  const { result, error, loading, run } = useRequest();
  const [id, setId] = useState("");
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "" });

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const payload = {};
  if (form.nombre) payload.nombre = form.nombre;
  if (form.descripcion) payload.descripcion = form.descripcion;
  if (form.precio) payload.precio = Number(form.precio);

  return (
    <div className="prod-card">
      <div className="prod-card-header">
        {/* El backend declara esta ruta como GET — ver nota en productos.api.js */}
        <span className="method get">GET</span>
        <code>/productos/update/:id</code>
        <span className="prod-card-desc">Actualizar producto</span>
      </div>
      <div className="prod-fields">
        <input
          placeholder="ID del producto *"
          value={id}
          onChange={(e) => setId(e.target.value)}
          type="number"
        />
        <input
          name="nombre"
          placeholder="Nuevo nombre"
          value={form.nombre}
          onChange={handle}
        />
        <input
          name="descripcion"
          placeholder="Nueva descripción"
          value={form.descripcion}
          onChange={handle}
        />
        <input
          name="precio"
          placeholder="Nuevo precio"
          type="number"
          value={form.precio}
          onChange={handle}
        />
      </div>
      <button
        className="prod-btn"
        onClick={() => run(() => actualizarProducto(id, payload))}
      >
        Actualizar
      </button>
      <ResultBox result={result} error={error} loading={loading} />
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────
export default function Productos() {
  return (
    <div className="productos-panel">
      <h2 className="productos-title">🛒 Panel de Productos</h2>
      <p className="productos-subtitle">
        Probá cada endpoint del backend directamente desde acá.
      </p>
      <div className="prod-grid">
        <SeccionGetActivos />
        <SeccionGetTodos />
        <SeccionInsert />
        <SeccionEstado />
        <SeccionActualizar />
      </div>
    </div>
  );
}
