# Ferramenta de Teste para Salesforce Messaging for Web com JWT

Esta documentação descreve o processo completo para implementar o Salesforce Messaging for In-App and Web com autenticação de usuário via JWT. O projeto inclui uma ferramenta de frontend para testes e um backend de exemplo na AWS Lambda.

## Índice

1.  [Como Usar o Repositório](https://www.google.com/search?q=%23como-usar-o-reposit%C3%B3rio)
2.  [Guia de Configuração (Salesforce)](https://www.google.com/search?q=%23guia-de-configura%C3%A7%C3%A3o-salesforce)
3.  [Guia de Configuração (Backend AWS Lambda)](https://www.google.com/search?q=%23guia-de-configura%C3%A7%C3%A3o-backend-aws-lambda)
4.  [Guia de Configuração (Frontend Vercel)](https://www.google.com/search?q=%23guia-de-configura%C3%A7%C3%A3o-frontend-vercel)
5.  [Conectando Tudo e Teste Final](https://www.google.com/search?q=%23conectando-tudo-e-teste-final)
6.  [Troubleshooting](https://www.google.com/search?q=%23troubleshooting)

## Como Usar o Repositório

Este repositório contém o código-fonte tanto para o **backend** de geração de tokens quanto para a **ferramenta de frontend**. O fluxo geral é:

1.  **Configurar o Salesforce:** Preparar a sua organização para aceitar o chat e a autenticação.
2.  **Configurar e Implantar o Backend:** Clonar este repositório e implantar o código do backend na AWS.
3.  **Configurar e Implantar o Frontend:** Implantar a ferramenta de teste `index.html` em um serviço de hospedagem como o Vercel.
4.  **Conectar e Testar:** Configurar o CORS e usar a ferramenta para validar a solução de ponta a ponta.

### Glossário de Termos (Dicionário de Dados)

  * **Issuer (iss):** O "emissor" do token. É o identificador do seu backend que o Salesforce usa para encontrar a configuração de verificação correta.
  * **Subject (sub):** O "assunto" do token. Representa o usuário final que está sendo autenticado (ex: `cliente-teste-001`).
  * **Audience (aud):** O "público" para o qual o token se destina. Neste caso, o serviço de login do Salesforce.
  * **Key ID (kid):** O "identificador da chave". É o nome de uma chave específica dentro de um conjunto, permitindo a seleção da chave correta para verificação.
  * **JWK (JSON Web Key):** Um formato de dados JSON que representa uma chave criptográfica.
  * **JWKS (JSON Web Key Set):** Um formato de dados JSON que representa um conjunto (uma lista) de JWKs.

### Imagem front

<img width="696" height="904" alt="Captura de tela 2025-07-23 203820" src="https://github.com/user-attachments/assets/593f23f8-6c52-423a-9d10-ca1a115b2ad7" />

-----

## Guia de Configuração (Salesforce)

### Parte 1: Canal de Mensagens e Campo de ID

  * **Habilite e Crie o Canal de Mensagens:** Siga o guia oficial da Salesforce para [configurar rapidamente o Messaging para Web](https://help.salesforce.com/s/articleView?id=service.miaw_setup_stages.htm&type=5). Este processo cria o canal e o *Embedded Service Deployment*.
  * **Crie o Campo de ID Externo:** No objeto `Contact`, crie um campo do tipo `Text` com **API Name** `IdExternoCliente__c` e marque a caixa **External ID**. Isso armazenará o `userId` que será usado no JWT.
  * **Crie um Contato de Teste:** Crie um novo registro de Contato e, no campo `IdExternoCliente__c`, insira um ID de teste (ex: `cliente-teste-001`).

### Parte 2: Autenticação (JWK + JWKS)

1.  **Gere as Chaves RSA:**

      * **Chave Privada** (para seu backend):
        ```bash
        openssl genrsa -out privatekey.pem 2048
        ```
      * **Chave Pública** (para o Salesforce):
        ```bash
        openssl rsa -in privatekey.pem -pubout -out publickey.pem
        ```

2.  **Converta a Chave Pública PEM para o Formato JWK (JSON):**

      * Para esta conversão, usamos a ferramenta online [PEM to JWK Converter](https://russel.github.io/pem-to-jwk/), que roda diretamente no seu navegador.
      * **Processo:**
        1.  Abra o seu arquivo `publickey.pem` em um editor de texto.
        2.  Copie **todo o conteúdo**, incluindo as linhas `-----BEGIN PUBLIC KEY-----` e `-----END PUBLIC KEY-----`.
        3.  Cole o conteúdo na caixa de texto da esquerda da ferramenta. O JSON correspondente será gerado na caixa da direita.
        4.  **Importante: Adicione as propriedades `kid`, `use` e `alg`.** Copie o JSON gerado e adicione essas três propriedades para que ele fique no formato final esperado pelo Salesforce:
            ```json
            {
              "kty": "RSA",
              "e": "AQAB",
              "n": "STRING_LONGA_GERADA_PELA_FERRAMENTA...",
              
              "kid": "test-auth-key",
              "use": "sig",
              "alg": "RS256"
            }
            ```
            > **Nota:** O valor do `kid` (Key ID) deve ser o mesmo que você usará na sua variável de ambiente `JWT_KEY_ID`.
        5.  Salve este JSON final em um arquivo `jwk.json`.

3.  **Cadastre o JWK e o JWKS no Salesforce:**

      * Siga o guia oficial para [configurar a verificação de usuário baseada em token](https://help.salesforce.com/s/articleView?id=service.miaw_token_based_user_verification_setup.htm&type=5).
      * **JWK:** Na seção "JSON Web Keys", clique em "New Key". Dê um nome (que pode ser o mesmo `kid`) e cole o conteúdo do seu arquivo `jwk.json` finalizado.
      * **JWKS:** Na seção "JSON Web Keysets", clique em "New Keyset". Dê um nome, defina o **Issuer**, mantenha o "Type" como "Keys" e selecione o JWK que você acabou de cadastrar.

-----

## Guia de Configuração (Backend AWS Lambda)

### 2.1: Clonando e Construindo o Projeto

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/matheuskmachado/authenticatedmiaw.git
    cd authenticatedmiaw
    ```
2.  **Construa o Pacote:** Navegue até a pasta do código do backend (`/src`) e execute:
      * `npm install` para instalar as dependências.
      * `npm run build`.
      * Compacte o arquivo `index.js` da pasta `dist` em arquivo `.zip`. (`deployment-package.zip`)

### 2.2: Deploy e Configuração na AWS

1.  **Crie a Função Lambda:** Crie uma função Lambda na AWS com runtime **Node.js** e faça o upload do seu arquivo `.zip`.
2.  **Armazene a Chave Privada:** No **AWS Secrets Manager**, crie um novo segredo ("Other type of secret") e cole o conteúdo do seu `privatekey.pem`. Anote o **ARN** do segredo.
3.  **Configure as Variáveis de Ambiente e Permissões:**
      * Na sua Lambda, em **Configuration \> Permissions**, edite a **IAM role** e adicione uma política que permita a ação `secretsmanager:GetSecretValue` no recurso do seu segredo.
      * Em **Configuration \> Environment variables**, adicione as seguintes variáveis:

| Variável | Exemplo de Valor | Descrição / Origem |
| :--- | :--- | :--- |
| `JWT_ALGORITHM` | `RS256` | Algoritmo de assinatura (deve ser RS256). |
| `JWT_AUDIENCE` | `https://login.salesforce.com` | O público-alvo do token (sempre este valor). |
| `JWT_EXPIRATION_IN_SECONDS` | `300` | Tempo de vida do token em segundos (5 minutos). |
| `JWT_ISSUER` | `com.test.chat.auth` | O valor exato do "Issuer" que você definiu no JWKS no Salesforce. |
| `JWT_KEY_ID` | `test-auth-key` | O "Key ID" (`kid`) que você usou no seu `jwk.json`. |
| `SECRET_ARN` | `arn:aws:secretsmanager:...` | O ARN completo do seu segredo no AWS Secrets Manager. |
| `SF_FIELD_API_NAME` | `IdExternoCliente__c` | Nome da API do campo de ID Externo no objeto Contato. |
| `SF_OBJECT_API_NAME`| `Contact` | Nome da API do objeto onde o `userId` será procurado. |

4.  **Configure o API Gateway:** Adicione um **Trigger** do tipo **API Gateway** à sua Lambda e anote a **API endpoint URL**.

-----

## Guia de Configuração (Frontend Vercel)

1.  **Faça o Deploy no Vercel:** Crie um novo projeto na Vercel e conecte-o ao seu repositório GitHub. A Vercel fará o deploy do `index.html` automaticamente.
2.  **Anote a URL do Frontend:** Copie a URL de produção fornecida pela Vercel.

-----

## Parte 4: Conectando Tudo e Teste Final

### 4.1: Configurando o CORS

1.  **No Salesforce:** Em **Setup \> CORS**, adicione uma nova regra permitindo a **URL do seu frontend na Vercel**.
2.  **Na AWS:** Para produção, configure o **API Gateway** para restringir o CORS, aceitando requisições apenas da **URL do seu frontend na Vercel**.

### 4.2: Executando o Teste Final

1.  **Obtenha os Códigos de Conexão:** Em **Setup \> Embedded Service Deployments**, selecione seu deployment, clique em **View** na seção **Install Code Snippet** e copie os valores necessários.
2.  **Abra e Configure a Ferramenta:** Acesse a URL da sua aplicação na Vercel e preencha os campos do **Passo 0** usando a tabela abaixo como guia.

| Campo na Ferramenta de Teste (`index.html`) | Valor de Origem |
| :--- | :--- |
| `JWT API` | URL do endpoint da sua função Lambda (da AWS) |
| `Script URL` | `Bootstrap Script URL` do snippet do Salesforce |
| `Org ID` | `Org ID` do snippet do Salesforce |
| `Deployment` | `Deployment Name` do snippet do Salesforce |
| `Site URL` | `Site URL` do snippet do Salesforce |
| `SCRT2 URL` | `SCRT2 URL` do snippet do Salesforce |

3.  **Execute o Fluxo:** Siga os passos na tela para gerar o token e iniciar o chat. Se a janela abrir e você estiver autenticado, a implementação foi um sucesso\!

-----

## Troubleshooting

  * **Ver o Histórico de Outro Usuário:** Use uma janela anônima ou limpe os dados do site (F12 \> Application \> Clear site data) para garantir uma sessão limpa.
  * **Erros:** Acompanhe a caixa de **Logs em Tempo Real** na ferramenta para identificar em que etapa a falha ocorre, também o console do navegador em casos de CORS/CSP.
