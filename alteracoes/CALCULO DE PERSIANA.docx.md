                                               **CALCULO DE PERSIANA**

**MODELOS: ROLO, ROMANA, PAINEL COM HASTES, PAINEL SEM HASTES, HORIZONTAL, MODELOS PREMIUM AMORIM,** 

Para o sistema, podemos estruturar assim:

**1\. Campos principais**

**Ambiente:**  
Ex.: Sala, quarto, varanda, lavabo.

**Fabricante:** Escolher fabricante entre (Rioflex, Gabriel Persianas, Amorim) ESSE PODE COLOCAR PRA ESCOLHER FABRICANTE PRIMEIRO E DEPOIS O TIPO DE PERSIANA

**Tipo de persiana:** ABRIR O QUE CADA FORNECEDOR TEM DE MODELOS:

* Persiana Rolo   
* Persiana Romana   
* Premium 

**Modelo / tecido:**  
Ex.: Tela Solar 1%, Tela Solar 3%, pimpoint 233, elegance 242, etc...

**Largura:** em metros  
**Altura:** em metros  
**Quantidade:** número de peças

**Lado a lado ou transpassada:** (apenas selecionar para aparecer no PDF e para o instalador.)

**Acionamento:**

* Manual   
* Motorizada 

**Instalação:**

* Teto  
* Parede   
* Dentro do vão   
* Fora do vão

**2\. Cálculo base da persiana**

O sistema deve calcular:

**M² \= largura x altura**

Depois:

**Valor da persiana \= m² x valor do m² do tecido/modelo**

Exemplo:  
Largura: 2,00 m  
Altura: 2,50 m

**2,00 x 2,50 \= 5,00 m²**

Se o valor do m² for R$ 280,00:

**5,00 x 280 \= R$ 1.400,00**

**3\. Regra de metragem mínima**

Importante colocar uma metragem mínima por peça.

**Metragem mínima por persiana: 1,50 m²**

Então, se a peça tiver:

0,80 x 1,20 \= 0,96 m²

O sistema deve considerar **1,50 m²** para cobrança. Mas no pedido pro fornecedor manter a metragem 0,80 x 1,20 pra fazer do tamanho certo. 

Fórmula:

**Se m² calculado for menor que 1,50 m², cobrar 1,50 m².**

**4\. Opção com bandô**

Criar campo:

**Bandô:**

* Sim   
* Não 

Se marcar **Sim**, abrir opções:

**Tipo de bandô:**

\- Abrir as opções de cada fornecedor.

Cálculo do bandô é por metro linear da largura.

**Valor do bandô \= largura da persiana x valor do metro linear do bandô**

Exemplo:  
Persiana com 2,00 m de largura  
Bandô R$ 150,00 por metro linear

**2,00 x 150 \= R$ 300,00**

Esse valor entra somado no orçamento.

**Laterais: (Selecionar a opção)**

* \- Sem laterais  
* \- Com laterais  
* \- Com lateral direita  
* \- Com lateral esquerda

**5\. Guias laterais**

Criar campo:

**Guia lateral:**

* Sim   
* Não 

Se marcar **Sim**, o sistema calcula:

**Valor guia lateral \= altura x valor do metro linear da guia**

Exemplo:  
Altura: 2,50 m  
Valor da guia: R$ 80,00/m

**2,50 x 80 \= R$ 200,00**

Esse valor entra somado no orçamento.

**6\. Guia de base**

Criar campo:

**Guia de base:**

* Sim   
* Não 

Se marcar **Sim**, calcular:

**Valor guia de base \= largura x valor do metro linear da guia de base**

Exemplo:  
Largura: 2,00 m  
Valor guia de base: R$ 90,00/m

**2,00 x 90 \= R$ 180,00**

**7 \- Campo principal**

**Motorização**

* Não   
* Sim 

Se marcar **SIM**, o sistema abre os campos abaixo.

---

**1\. Motor (obrigatório)**

Campo:

**Motor** *(lista suspensa / dropdown)*

Exemplo:

* Motor A – R$ X   
* Motor B – R$ X   
* Motor Tubular 220V – R$ X   
* Motor Wi-Fi – R$ X   
* Motor Somfy – R$ X   
* Motor Amorim – R$ X 

Cada motor terá no cadastro:

* Nome   
* Valor de custo   
* Limite de largura/peso (opcional) 

O sistema:

✔ abre lista apenas com a ref o nome do motor (pois alguns são limitados pela largura)  
✔ vendedor escolhe  
✔ valor entra automaticamente.

---

**2\. Controle remoto (opcional)**

Campo:

**Controle remoto**

* Não   
* Sim 

Se marcar **Sim**, abre:

**Modelo do controle** *(lista)*

Exemplo:

* 1 canal   
* 5 canais   
* 15 canais   
* Hub / Wi-Fi 

O valor soma automaticamente.

---

**3\. Instalação da motorização (obrigatória)**

Aqui eu colocaria automático.

Quando:

**Motorização \= Sim**

O sistema:

✔ adiciona automaticamente

**Instalação da motorização \= R$ 120,00**

Sem perguntar.

Pode aparecer apenas visualmente:

**Instalação motorização: R$ 120,00 (automática)**

Porque se deixar editável ou opcional, alguém vai esquecer.

**4\. Fórmula**

Se:

Motorização \= Sim

Então:

**Valor motorização \= motor \+ controle (se houver) \+ instalação obrigatória (120)**

---

**Exemplo**

Motor: R$ 780  
Controle 5 canais: R$ 280  
Instalação: R$ 120  
Total: **R$ 1.180**

**Texto pronto pro programador**

Criar campo "Motorização" com opção Sim/Não.

Quando marcado Sim, abrir:

1. Campo obrigatório "Motor" em lista suspensa (dropdown), puxando motores cadastrados e seus respectivos valores.   
2. Campo "Controle remoto" com opção Sim/Não. Quando marcado Sim, abrir lista de modelos de controle remoto cadastrados e seus valores.   
3. Adicionar automaticamente "Instalação de motorização" no valor fixo de R$ 120,00, obrigatória quando houver motorização. 

Fórmula:

Valor motorização \= motor \+ controle remoto (se houver) \+ instalação fixa de R$ 120,00.

**7\. Instalação**

Criar campo de instalação:

**Valor da instalação:**  
É calculado por peça.

Calculo para o sistema: (Tem tabela de instalação)

**Instalação \= quantidade de peças x valor fixo por peça**

Exemplo:  
2 rolos x R$ 60,00 \= R$ 120,00

3 romanas x R$ 60,00 \= R$ 180,00 

**7\. PDF**

Aparecer pro cliente. Selecionar o q aparecer pro cliente, medidas e tal.

**Ambiente:**  
**Modelo:** Rolo ou Romana  
**Opcionais:** (Guias laterais, bando, guia de base se tiver.)  
Motorização se tiver.  
**Instalação Inclusa**  
**Valor de venda**

