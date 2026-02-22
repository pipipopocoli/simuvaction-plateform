import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            
            WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            PARA = WORD_NAMESPACE + 'p'
            TEXT = WORD_NAMESPACE + 't'
            
            text = []
            for paragraph in tree.iter(PARA):
                texts = [node.text for node in paragraph.iter(TEXT) if node.text]
                if texts:
                    text.append(''.join(texts))
            
            return '\n'.join(text)
    except Exception as e:
        return f"Error: {e}"

text = extract_text_from_docx('SimuVaction-War-Room-Complete-Spec.docx')
with open('extracted_spec.txt', 'w') as f:
    f.write(text)
print("Extracted successfully. Wrote to extracted_spec.txt")
