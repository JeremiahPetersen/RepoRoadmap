import React, { useState, useEffect } from "react";

function TreeNode({ node }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent =
    (node.endpoints && node.endpoints.length > 0) ||
    (node.definitions && node.definitions.length > 0);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <li>
      <span
        onClick={handleToggle}
        style={hasContent ? { color: "#0077cc" } : {}}
      >
        {node.name}
      </span>
      {isExpanded && (
        <div>
          {node.endpoints && node.endpoints.length > 0 && (
            <div>
              <strong>Endpoints:</strong>
              <ul>
                {node.endpoints.map((endpoint, index) => (
                  <li key={index} style={{ color: "#0077cc" }}>
                    {endpoint}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {node.definitions && node.definitions.length > 0 && (
            <div>
              <strong>Definitions:</strong>
              <ul>
                {node.definitions.map((definition, index) => (
                  <li key={index}>{definition}</li>
                ))}
              </ul>
            </div>
          )}
          {node.children && node.children.length > 0 && (
            <ul>
              {node.children.map((child) => (
                <TreeNode key={child.name} node={child} />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function App() {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    // Fetch the roadmap tree structure from the server
    fetch("/data/roadmap-tree.json")
      .then((response) => response.json())
      .then((data) => setTree(data))
      .catch((error) => console.error("Error fetching roadmap tree:", error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>GitHub Repository Roadmap</h1>
        <p>
          Visualizing the structure and connections of files within a GitHub
          repository.
        </p>
      </header>
      <main>
        <ul className="tree">
          {tree.map((rootNode) => (
            <TreeNode key={rootNode.name} node={rootNode} />
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
