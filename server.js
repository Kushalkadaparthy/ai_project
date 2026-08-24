const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================
   GEMINI
========================================= */

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing from .env");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


/* =========================================
   MIDDLEWARE
========================================= */

app.use(express.json());

/*
   Serve everything inside the same folder
   as server.js.

   This means:
   server.js
   index.html
   are in the same folder.
*/

app.use(express.static(__dirname));


/* =========================================
   GEMINI CHAT
========================================= */

app.post("/api/chat", async (req, res) => {

    try {

        const message = req.body.message;
        const history = req.body.history || [];

        if (!message || !message.trim()) {

            return res.status(400).json({
                error: "Message is empty."
            });

        }


        /*
           Build conversation context
        */

        let contents = [];

        if (Array.isArray(history)) {

            history.forEach(item => {

                if (
                    item &&
                    item.role &&
                    item.text
                ) {

                    contents.push({
                        role: item.role === "model"
                            ? "model"
                            : "user",

                        parts: [
                            {
                                text: item.text
                            }
                        ]
                    });

                }

            });

        }


        /*
           Add current message
        */

        contents.push({

            role: "user",

            parts: [
                {
                    text: message
                }
            ]

        });


        /*
           Send to Gemini
        */

        const response =
            await ai.models.generateContent({

                model: "gemini-3.6-flash",

                contents: contents

            });


        const reply =
            response.text ||
            "I couldn't generate a response.";


        res.json({

            reply: reply

        });

    }

    catch (error) {

        console.error(
            "Gemini API error:",
            error
        );

        res.status(500).json({

            error:
                error.message ||
                "Gemini request failed."

        });

    }

});


/* =========================================
   FALLBACK
========================================= */

/*
   If the browser requests "/",
   explicitly send the real index.html.

   This is the important part for your
   current blank-page problem.
*/

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );

        console.log(
            "       AXIOM AI SERVER"
        );

        console.log(
            "================================"
        );

        console.log(
            `Running at: http://localhost:${PORT}`
        );

        console.log(
            `HTML file: ${path.join(__dirname, "index.html")}`
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);