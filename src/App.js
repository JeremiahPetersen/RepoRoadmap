import React, { useState, useEffect } from "react";
import "./App.css";

function TreeNode({ node }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChildrenOrDefinitions =
    (node.endpoints && node.endpoints.length > 0) ||
    (node.definitions && node.definitions.length > 0) ||
    (node.children && node.children.length > 0);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <li>
      {hasChildrenOrDefinitions && (
        <span onClick={handleToggle} style={{ cursor: "pointer" }}>
          {isExpanded ? "↓" : "→"}
        </span>
      )}
      <span
        onClick={handleToggle}
        className={hasChildrenOrDefinitions ? "expandable" : ""}
        style={{ marginLeft: "5px" }}
      >
        {node.name}
      </span>
      {isExpanded && (
        <div>
          {node.endpoints && node.endpoints.length > 0 && (
            <div>
              <strong>Endpoints:</strong>
              <ul>
                {node.endpoints.map((endpoint) => (
                  <li key={endpoint} style={{ color: "#0077cc" }}>
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
                {node.definitions.map((definition) => (
                  <li key={definition}>{definition}</li>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTree, setFilteredTree] = useState([]);

  useEffect(() => {
    // Fetch the roadmap tree structure from the server
    fetch("/data/roadmap-tree.json")
      .then((response) => response.json())
      .then((data) => {
        setTree(data);
        setFilteredTree(data);
      })
      .catch((error) => console.error("Error fetching roadmap tree:", error));
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = tree.filter(
        (node) =>
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (node.definitions &&
            node.definitions.some((def) =>
              def.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      );
      setFilteredTree(filtered);
    } else {
      setFilteredTree(tree);
    }
  }, [searchQuery, tree]);

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
        <input
          type="text"
          placeholder="Search for files or definitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: "10px", padding: "5px", width: "90%" }}
        />
        <ul className="tree">
          {filteredTree.map((rootNode) => (
            <TreeNode key={rootNode.name} node={rootNode} />
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
