from flask import Flask, render_template, request, jsonify
import json
import os
import uuid

app = Flask(__name__)

# just keeping everything in a json file, no need for a real database for this
DATA_FILE = "portfolio.json"


def load_holdings():
    # if there's no file yet (first run) just give back an empty list
    if not os.path.exists(DATA_FILE):
        return []

    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_holdings(holdings):
    with open(DATA_FILE, "w") as f:
        json.dump(holdings, f, indent=4)


@app.route("/")
def index():
    # just serves the html page, all the actual data stuff happens through the api routes below
    return render_template("index.html")


@app.route("/api/holdings", methods=["GET"])
def get_holdings():
    holdings = load_holdings()
    return jsonify(holdings)


@app.route("/api/holdings", methods=["POST"])
def add_holding():
    data = request.get_json()

    # quick check so we don't save garbage data
    required_fields = ["ticker", "quantity", "purchase_price", "current_price"]
    for field in required_fields:
        if field not in data or data[field] == "":
            return jsonify({"error": f"missing {field}"}), 400

    holdings = load_holdings()

    new_holding = {
        "id": str(uuid.uuid4()),  # random unique id so we can find it later to edit/delete
        "ticker": data["ticker"].upper().strip(),
        "quantity": float(data["quantity"]),
        "purchase_price": float(data["purchase_price"]),
        "current_price": float(data["current_price"])
    }

    holdings.append(new_holding)
    save_holdings(holdings)

    return jsonify(new_holding), 201


@app.route("/api/holdings/<holding_id>", methods=["PUT"])
def update_holding(holding_id):
    data = request.get_json()
    holdings = load_holdings()

    # find the holding with this id
    holding = None
    for h in holdings:
        if h["id"] == holding_id:
            holding = h
            break

    if holding is None:
        return jsonify({"error": "holding not found"}), 404

    # update whatever fields got sent, keep the rest as is
    holding["ticker"] = data.get("ticker", holding["ticker"]).upper().strip()
    holding["quantity"] = float(data.get("quantity", holding["quantity"]))
    holding["purchase_price"] = float(data.get("purchase_price", holding["purchase_price"]))
    holding["current_price"] = float(data.get("current_price", holding["current_price"]))

    save_holdings(holdings)
    return jsonify(holding)


@app.route("/api/holdings/<holding_id>", methods=["DELETE"])
def delete_holding(holding_id):
    holdings = load_holdings()

    # rebuild the list without the one we're deleting
    new_holdings = [h for h in holdings if h["id"] != holding_id]

    if len(new_holdings) == len(holdings):
        # nothing got removed, so the id didn't match anything
        return jsonify({"error": "holding not found"}), 404

    save_holdings(new_holdings)
    return jsonify({"message": "deleted"})


if __name__ == "__main__":
    # debug=True just so it auto reloads when I change stuff, turn off for production
    app.run(debug=True)
