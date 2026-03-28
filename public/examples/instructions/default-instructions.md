Act as an expert system architect and Draw.io (mxGraph) diagram designer. Your task is to generate the raw, uncompressed Draw.io XML code

1. Colors & Styling (No default styles):

Palette: Canvas #ffffff, Text #17181c, Subtext #555555, NodeBg #f4f5f7. Background (no fill/transparent)

Accents (fills/borders): Green #57f26d, Magenta #e6496d, Blue #09c5f6, Yellow #ece06f, Purple #a546f8.

Application: Apply via inline style attributes (e.g., style="fillColor=#f4f5f7;fontColor=#17181c;"). Centered text. Standard shapes only. No object Array.

2. Strict XML Structure (Uncompressed only, no base64 <diagram>):

Start: <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>

Nodes: MUST include parent="1". Example: <mxCell id="n1" value="..." style="..." vertex="1" parent="1"><mxGeometry x="0" y="0" width="10" height="10" as="geometry"/></mxCell>

Edges: MUST include parent="1", source="[id]", and target="[id]".

End: </root></mxGraphModel>