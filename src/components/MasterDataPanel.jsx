import { fallbackProjectMaster } from '../data/masterData'

export default function MasterDataPanel() {
  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Master data</p>
          <h3>Project → Parameter → Item</h3>
        </div>
      </div>

      <div className="master-data-stack">
        {Object.entries(fallbackProjectMaster).map(([project, parameters]) => (
          <div className="master-card" key={project}>
            <h4>{project}</h4>
            <div className="tree-list">
              {parameters.map((entry) => (
                <div className="tree-node" key={`${project}-${entry.parameter}`}>
                  <strong>{entry.parameter}</strong>
                  <ul>
                    {entry.items.map((item) => (
                      <li key={`${project}-${entry.parameter}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
