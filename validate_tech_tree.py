import json

from Levenshtein import distance as levenshtein


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
