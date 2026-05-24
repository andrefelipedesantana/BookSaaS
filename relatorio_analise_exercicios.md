# Relatório: Análise das Funcionalidades de Exercícios e Correções no Athenis 2

## 1. Resumo Executivo

Após análise completa do código, a conclusão é que **já existe bastante coisa implementada** no backend para questões discursivas e correção com IA, mas **o frontend está muito atrasado** — ele só suporta questões objetivas (múltipla escolha). Abaixo segue o detalhamento completo.

---

## 2. O que JÁ está implementado

### 2.1 Backend — Models (Banco de Dados) ✅ Pronto

O model [Question](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/models.py#L171-L184) **já suporta questões discursivas**. Ele tem o campo `question_type` com duas opções:

```python
class QuestionChoices(models.TextChoices):
    multiple_choice = "MC", "Multiple Choices"
    subjetive = "S", "Subjective"  # <-- Questão discursiva!
```

O model [Answer](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/models.py#L195-L204) **também já suporta respostas discursivas**:

```python
class Answer(models.Model):
    alternative = models.ForeignKey(..., null=True)  # null para discursivas
    question = models.ForeignKey(to=Question, ...)
    response = models.CharField(null=True, blank=True)  # texto da resposta discursiva
    is_correct = models.BooleanField(null=True)          # resultado da correção
    explanation = models.CharField(null=True)             # explicação da IA
    additional_comments = models.CharField(null=True)     # comentários adicionais da IA
```

> [!TIP]
> **Conclusão: Não é necessário criar novas tabelas nem rodar migrations para o esquema de questões discursivas — o banco já está preparado!**

---

### 2.2 Backend — Geração de Exercícios com Questões Discursivas ✅ Pronto (v2)

Existem **duas versões** da geração de exercícios:

| Versão | Arquivo | Gera discursivas? |
|---|---|---|
| v1 (`generate_exercises_with_ai`) | [tasks.py L513-572](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/tasks.py#L513-L572) | ❌ Só objetivas |
| **v2** (`generate_exercises_with_ai_v2`) | [tasks.py L576-633](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/tasks.py#L576-L633) | **✅ Sim! Gera objetivas e discursivas** |

A task v2 já trata o `question_type`:
```python
if question.question_type == "multiple_choice":
    qt = Question.QuestionChoices.multiple_choice
else:
    qt = Question.QuestionChoices.subjetive
```

O prompt [EXERCISE_GENERATOR_V3](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/prompts.py#L135-L187) já instrui a IA a gerar ambos os tipos:
> *"Gere dois tipos de perguntas: Perguntas de múltipla escolha e Perguntas subjetivas que exijam uma resposta discursiva"*

O schema Pydantic [ExerciseV2](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/schema.py#L35-L36) já modela os dois tipos de questão:
```python
class ExerciseV2(BaseModel):
    questions: list[MultipleChoiceQuestionV2 | SubjectiveQuestionV2]
```

A View (API) [generate_exercise_v2](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/views/exercise_view.py#L574-L611) já está registrada e pronta para ser chamada.

---

### 2.3 Backend — Correção de Questões Discursivas com IA ✅ Pronto

A correção com IA está implementada:

- **Função OpenAI**: [generate_correction](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/openai.py#L211-L261) — recebe a pergunta e a resposta do aluno, consulta os materiais vetorizados (Vector Store) e gera uma correção avaliando se a resposta está correta, incluindo explicação e comentários.
- **Prompts**: [GRADER](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/prompts.py#L264-L330) e [GRADER_FORMATTER](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/prompts.py#L332-L387) — instruem a IA a corrigir e formatar o resultado.
- **Task Celery**: [correct_answer](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/tasks.py#L731-L786) — itera sobre as respostas discursivas, chama a IA, e salva `is_correct`, `explanation` e `additional_comments` no banco.

### 2.4 Backend — View de Submissão (AssignmentStudent) ✅ Pronto

A view [AssignmentStudentViewSet.create](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/views/assignment_student_view.py#L144-L228) **já aceita respostas discursivas**. Ela separa:
- `alternatives`: para questões de múltipla escolha
- `answers`: para questões discursivas (com `question` e `response` em texto)

Ao final, chama `correct_answer.delay(...)` para enviar a correção com IA para o Celery em background.

O serializer [AssignmentStudentSerializer](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/serializers.py#L235-L272) **também já define o campo `answers`**:
```python
answers = AnswerSerialzer(many=True, write_only=True)
```

---

## 3. O que FALTA implementar (Frontend) ❌

### 3.1 Geração de Exercício — Frontend chama apenas a v1

O serviço [ExerciseService.createGenerated](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/utils/axios/service/exercise.tsx#L41-L50) chama o endpoint **v1** (`/exercises/generate_exercise/`), que só gera questões objetivas. Falta:
- Adicionar um método que chame o endpoint **v2** (`/exercises/generate_exercise_v2/`)
- Ou substituir a chamada atual pela v2

### 3.2 Tela de Gerar Exercício — Sem opção de tipo

O componente [AddGeneratedExercise](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/exercises/generate/add/AddGeneratedExercise.tsx) não oferece opção para o professor escolher o tipo de geração (só objetivas vs. mista com discursivas). O formulário atualmente não menciona questões subjetivas.

### 3.3 Tela de Fazer Exercício — Só renderiza objetivas

O componente [DoExercise](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/assignment/do/DoExercise.tsx#L55-L99) renderiza apenas alternativas com `radio buttons`. Se a questão não tiver alternativas (for subjetiva), **nada é mostrado**. Falta:
- Verificar o `question_type` de cada questão
- Renderizar um `<textarea>` para questões discursivas

### 3.4 Submissão de Respostas — Só envia alternativas

O componente [DoAssignment](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/assignment/do/DoAssignment.tsx#L129-L139) constrói o body de submissão **apenas com `alternatives`**:
```typescript
const body: AssignmentStudentBody = {
    alternatives: selectedAnswers.filter(...),
    assignment: assignmentId,
};
```
O tipo `AssignmentStudentBody` ([assignment.tsx L22-25](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/utils/axios/service/assignment.tsx#L22-L25)) **não tem o campo `answers`** para enviar respostas discursivas. Precisa ser adicionado.

### 3.5 Tela de Resultado do Aluno — Não exibe feedback da IA

O componente [ResultAssignmentForStudent](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/assignment/view/ResultAssignmentForStudent.tsx) exibe apenas nota e acertos. **Não exibe** `explanation` nem `additional_comments` da correção da IA.

### 3.6 Tipos TypeScript — Sem `question_type`

O tipo [Question](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/types/Question.ts) não tem o campo `question_type`. Precisa ser adicionado para que o frontend saiba diferenciar objetivas de discursivas.

---

## 4. Mapa Visual de Status

```
FLUXO COMPLETO:

Professor gera exercício → IA cria questões → Aluno responde → IA corrige → Resultado

[Backend API v2]  ✅    [Prompts IA]  ✅    [Backend Submit] ✅   [Celery Correct] ✅  [Models] ✅
[Frontend Form]   ❌    [Front Render] ❌    [Front Submit]   ❌   [Front Results]  ❌   [Types]  ❌
```

---

## 5. Plano de Implementação — Divisão entre Você e seu Colega

> [!IMPORTANT]
> A sugestão é dividir por camada: **um foca no fluxo de geração** (professor gerando exercício) e **outro no fluxo de resolução e resultado** (aluno respondendo + visualizando feedback da IA).

### 👤 Pessoa A — "Geração de Exercícios Discursivos"
**Foco: Tela do Professor para gerar e visualizar exercícios com questões discursivas**

| # | Tarefa | Arquivo(s) | Esforço |
|---|---|---|---|
| A1 | Atualizar o tipo `Question` no TS para incluir `question_type` | `frontend/src/types/Question.ts` | Baixo |
| A2 | Adicionar método `createGeneratedV2` no serviço de exercício (chamar endpoint v2) | `frontend/src/utils/axios/service/exercise.tsx` | Baixo |
| A3 | Adicionar opção na tela de geração para o professor escolher o tipo de exercício (ex: "Gerar com questões discursivas") | `frontend/src/features/exercises/generate/add/AddGeneratedExercise.tsx` e filhos | Médio |
| A4 | Atualizar telas de visualização/edição de exercício para exibir corretamente questões subjetivas (sem alternativas) | `frontend/src/features/exercises/edit/` e `static/` | Médio |
| A5 | Testar fluxo completo de geração via v2: Professor cria → backend gera com IA → exercício aparece com questões mistas | E2E | Médio |

---

### 👤 Pessoa B — "Resolução + Correção com IA + Visualização de Feedback"
**Foco: Tela do Aluno para responder questões discursivas e ver o feedback da IA**

| # | Tarefa | Arquivo(s) | Esforço |
|---|---|---|---|
| B1 | Atualizar `DoExercise.tsx` para renderizar `<textarea>` quando `question_type === 'S'` | `frontend/src/features/assignment/do/DoExercise.tsx` | Médio |
| B2 | Atualizar `DoAssignment.tsx` para coletar as respostas discursivas (texto) junto das objetivas | `frontend/src/features/assignment/do/DoAssignment.tsx` | Médio |
| B3 | Atualizar `AssignmentStudentBody` para incluir campo `answers` com `{ question: number, response: string }[]` | `frontend/src/utils/axios/service/assignment.tsx` | Baixo |
| B4 | Atualizar `ResultAssignmentForStudent.tsx` para exibir o feedback da IA (`explanation`, `additional_comments`, `is_correct`) por questão discursiva | `frontend/src/features/assignment/view/ResultAssignmentForStudent.tsx` | Alto |
| B5 | (Opcional) Criar endpoint/tela para o professor ver o feedback da IA por questão subjetiva de cada aluno | Nova view no backend + componente novo no frontend | Alto |
| B6 | Testar fluxo completo: Aluno responde → Celery corrige com IA → resultado aparece com feedback | E2E | Médio |

---

## 6. Observação sobre um Bug no Schema

> [!WARNING]
> No schema Pydantic do backend, há um **typo** no campo `question_type` da questão subjetiva:
> ```python
> class SubjectiveQuestionV2(BaseModel):
>     question_type: Literal["subjetcive"]  # ← Errado! Deveria ser "subjective"
> ```
> Localização: [schema.py L31](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/schema.py#L31)
>
> E no model Django o valor salvo é `"S"` (com o label `"Subjective"`), enquanto no schema Pydantic o valor esperado da IA é `"subjetcive"` (com typo). A task v2 faz a conversão corretamente verificando se **não é** `multiple_choice`, então funciona, mas é bom ter ciência disso.

---

## 7. Resumo Final

| Funcionalidade | Backend | Frontend |
|---|---|---|
| Gerar exercício com questões objetivas (v1) | ✅ | ✅ |
| Gerar exercício com questões discursivas (v2) | ✅ | ❌ |
| Aluno responder questão objetiva | ✅ | ✅ |
| Aluno responder questão discursiva | ✅ | ❌ |
| Pré-correção com IA (questões discursivas) | ✅ | ❌ (resultado não exibido) |
| Exibir feedback da IA para o aluno | ✅ (dados salvos) | ❌ |

**O trabalho principal é no Frontend.** O backend está essencialmente pronto.
