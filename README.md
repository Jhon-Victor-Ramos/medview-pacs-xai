# MedView PACS - Protótipo XAI

Protótipo de alta fidelidade desenvolvido para a disciplina de Concepção de Artefatos Digitais (_CAD_) do Centro de Informática da UFPE (_CIn_-UFPE).

O objetivo deste projeto é simular uma interface de _Sistema de Suporte à Decisão Clínica_ (CDSS) integrada a um visualizador _PACS_ (basicamente, exames de imagens), aplicando conceitos de Inteligência Artificial Explicável (_XAI_) e *Human-in-the-Loop* para reduzir a carga cognitiva de médicos não-radiologistas no SUS.

## Funcionalidades Simuladas
Este protótipo não possui back-end. Ele foi construído para testes de usabilidade qualitativos utilizando a técnica do **[Mágico de Oz](https://www-nngroup-com.translate.goog/articles/wizard-of-oz/?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt&_x_tr_pto=tc)**.

* **Auditoria de imagem:** Alerta modal sobre ruído/baixa qualidade estrutural da aquisição radiológica.
* **Mapa de calor (Grad-CAM):** Indicação visual de anomalias com controle de opacidade pelo usuário.
* **Explicabilidade (XAI):** _Tooltips_ com justificativas clínicas sobre as regiões marcadas pela IA.
* **Comparativo Side-by-Side:** Alternância visual entre imagem original (RAW) e aprimorada (Enhanced).
* **Escalonamento Humano:** Simulação de chat assíncrono para solicitação de 2ª opinião de teleradiologia.

## Controles de Teste (Mágico de Oz)
Para o pesquisador operar a transição de telas de forma invisível durante as entrevistas (*Think-Aloud Protocol*), os seguintes atalhos de teclado estão configurados:

* `Seta para a Direita (ArrowRight)`: Avança o estado do protótipo (1. Dor -> 2. Alerta -> 3. Solução XAI).
* `Seta para a Esquerda (ArrowLeft)`: Retorna ao estado anterior.
* `Shift + Clique na Imagem`: Calibra as coordenadas (Eixo X e Y) do mapa de calor e do tooltip de explicação para o local exato da lesão anatômica antes do início do teste.

## Tecnologias
* HTML5
* CSS3 (Vanilla, CSS Variables, Flexbox)
* JavaScript (Vanilla)

## Hospedagem
Disponível via [_GitHub Pages_](https://docs.github.com/pt/pages/getting-started-with-github-pages/creating-a-github-pages-site). Para uma melhor experiência de simulação, recomenda-se acessar pelo Google Chrome e utilizar o modo Tela Cheia (`F11`).
Link:
- *[medview-pacs-xai](https://jhon-victor-ramos.github.io/medview-pacs-xai/)*
