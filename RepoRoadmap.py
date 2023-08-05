import json
import re

def parse_repository_txt(filepath):
    """
    Parse the txt file containing the repository contents.
    Return a dictionary with file paths as keys and file content as values.
    """
    with open(filepath, 'r') as file:
        content = file.read()

    files = content.split("'''---")
    repo_map = {}

    for file in files[1:]:  # Skipping the first element as it will be empty
        parts = file.split('---', 1)
        if len(parts) == 2:
            path, file_content = parts
            repo_map[path.strip()] = file_content.strip()

    return repo_map

def normalize_path(path):
    """
    Normalize the file path by removing leading './' and other potential discrepancies.
    """
    return path.lstrip('./')

def detect_definitions(file_content, file_type):
    """
    Detect and return a list of function and class definitions based on the file type.
    """
    definitions = []

    if file_type == ".py":
        # Detecting Python function and class definitions
        func_patterns = [
            r'^\s*def\s+(\w+)\s*\(',
            r'^\s*class\s+(\w+)'
        ]
    elif file_type in [".js", ".ts"]:
        # Detecting JavaScript and TypeScript function, class, and endpoint definitions
        func_patterns = [
            r'function\s+(\w+)\s*\(',
            r'const\s+(\w+)\s*=\s*function\s*\(',
            r'const\s+(\w+)\s*=\s*\(\s*\)\s*=>',
            r'^\s*class\s+(\w+)'
        ]
    else:
        return definitions

    for pattern in func_patterns:
        matches = re.findall(pattern, file_content, re.MULTILINE)
        definitions.extend(matches)

    return definitions

def identify_endpoints_and_definitions(file_content, repo_map, current_file_path):
    """
    Enhanced detection of other files mentioned in this file's content with directory context.
    Also captures function and class definitions.
    Returns a dictionary with endpoints and definitions.
    """
    endpoints = []
    definitions = []
    file_type = current_file_path.split('.')[-1]  # Extract the file extension

    # Patterns for detecting file references
    patterns = [
        r'open\("([^"]+)"\)',
        r'import\s+"([^"]+)"',
        r'require\("([^"]+)"\)'
    ]

    # Get the directory context of the current file
    directory_context = "/".join(current_file_path.split("/")[:-1])

    for pattern in patterns:
        matches = re.findall(pattern, file_content)
        for match in matches:
            # Normalize and adjust path based on directory context
            normalized_match = normalize_path(match)
            if directory_context:
                adjusted_path = f"{directory_context}/{normalized_match}"
            else:
                adjusted_path = normalized_match

            if adjusted_path in repo_map:
                # Recursively identify endpoints for nested files
                endpoints.extend(identify_endpoints_and_definitions(repo_map[adjusted_path], repo_map, adjusted_path)["endpoints"])
                endpoints.append(adjusted_path)
            else:
                print(f"WARNING: Endpoint {adjusted_path} identified, but not found in repo_map.")

    # Detect and add definitions for the relevant file types
    definitions = detect_definitions(file_content, f".{file_type}")

    return {"endpoints": endpoints, "definitions": definitions}

def build_tree_structure_v2(roadmap):
    """
    Convert the roadmap data into a tree structure, handling circular references.
    Separate the endpoints and definitions in the tree structure.
    """
    nodes = {
        path: {
            "name": path,
            "children": [],
            "endpoints": roadmap[path]['endpoints'],
            "definitions": roadmap[path]['definitions']
        } 
        for path in roadmap.keys()
    }
    visited = set()

    def build_node(path):
        if path in visited:
            # Return only the name for nodes that have been visited
            return {"name": path}

        visited.add(path)
        children = roadmap.get(path)["endpoints"] or []  # Ensure we get a list

        child_nodes = [build_node(child) for child in children if child not in visited]

        nodes[path]["children"] = child_nodes  # Update the children for this node
        return nodes[path]

    trees = [build_node(path) for path in roadmap.keys() if path not in visited]

    return trees

def save_roadmap_tree_to_json(tree_structure):
    """
    Save the roadmap tree structure as a JSON file.
    """
    with open('roadmap-tree.json', 'w') as f:
        json.dump(tree_structure, f)

# Test
filepath = 'repository.txt'
repo_map = parse_repository_txt(filepath)

# Generate the roadmap
roadmap = {path: identify_endpoints_and_definitions(content, repo_map, path) 
           for path, content in repo_map.items() if not path.endswith(('.yml', '.json', '.md'))}

tree_structure_v2 = build_tree_structure_v2(roadmap)
save_roadmap_tree_to_json(tree_structure_v2)

# Print the first few tree nodes for verification
for node in tree_structure_v2[:3]: # change this after testing
    print(node)