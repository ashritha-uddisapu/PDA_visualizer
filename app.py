
from flask import Flask, request, jsonify, render_template

from pda import PushdownAutomaton

app = Flask(__name__)

# Initialize PDA
pda = PushdownAutomaton()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/simulate", methods=["POST"])
def simulate():

    try:

        # Receive input from frontend
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "Invalid request format."
            }), 400

        expression = data.get("expression")

        if not isinstance(expression, str):
            return jsonify({
                "error": "Expression must be a string."
            }), 400

        # Execute PDA
        result = pda.simulate(expression)

        # Return simulation result
        return jsonify(result)

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )
