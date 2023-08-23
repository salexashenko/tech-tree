import json

from Levenshtein import distance as levenshtein


# Define the function to remove "ancestor" type links from the tech tree
def remove_ancestor_links(tech_tree):
    # Create a mapping of node IDs to their direct dependencies
    direct_dependencies = {node["id"]: set(node["dependencies"]) for node in tech_tree}

    # Create a function to recursively find all ancestor dependencies of a given node
    def find_ancestors(node_id, direct_dependencies):
        ancestors = set()
        for dep in direct_dependencies[node_id]:
            ancestors.add(dep)
            ancestors.update(find_ancestors(dep, direct_dependencies))
        return ancestors

    # Update each node's dependencies to remove any ancestors of direct dependencies
    for node in tech_tree:
        node_id = node["id"]
        direct_deps = direct_dependencies[node_id]
        all_ancestors = set()
        for dep in direct_deps:
            all_ancestors.update(find_ancestors(dep, direct_dependencies))
        # Remove ancestor dependencies, retaining only direct dependencies
        node["dependencies"] = list(direct_deps - all_ancestors)

    return tech_tree


# Apply the function to the current tech tree
updated_tech_tree = remove_ancestor_links(standardized_tech_tree)

# Save the updated tech tree back to techTree.json
with open("/mnt/data/techTree.json", "w") as f:
    json.dump(updated_tech_tree, f, indent=4)


def validate_tech_tree_updated(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)

    node_ids = [item["id"] for item in data]
    changes_made = False

    for item in data:
        for dep in item["dependencies"]:
            if dep not in node_ids:
                print(
                    f"Dependency '{dep}' in '{item['id']}' does not have a corresponding node."
                )
                suggestion = closest_node(dep, node_ids)
                print(f"Closest existing node: {suggestion}")

                while True:
                    choice = input(
                        "Press 'y' to change the dependency to match the existing node, "
                        "or 'n' to add a new node: "
                    ).lower()

                    if choice == "y" or choice == "":
                        item["dependencies"][
                            item["dependencies"].index(dep)
                        ] = suggestion
                        print(f"Changed '{dep}' to '{suggestion}' in '{item['id']}'.\n")
                        changes_made = True
                        break
                    elif choice == "n":
                        new_node = {
                            "id": dep,
                            "label": dep.capitalize(),
                            "dependencies": [],
                        }
                        data.append(new_node)
                        print(f"Added new node: {dep}\n")
                        node_ids.append(dep)
                        changes_made = True
                        break

    if changes_made:
        with open(file_path, "w") as f:
            json.dump(data, f, indent=4)
            print("techTree.json has been updated.")


def closest_node(target, nodes):
    """Find the closest node to the target using Levenshtein distance."""
    return min(nodes, key=lambda x: levenshtein(target, x))


if __name__ == "__main__":
    validate_tech_tree_updated("techTree.json")
