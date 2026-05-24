# Plano de Implementação — Questões Discursivas + Pré-Correção com IA

## Contexto

Duas funcionalidades a serem implementadas no Athenis 2:
1. **Geração de exercícios com questões discursivas** (manual e assistida por IA)
2. **Pré-correção de questões discursivas com IA** (fluxo iniciado pelo professor)

---

## O que precisa mudar no Backend (que antes parecia "pronto")

> [!WARNING]
> A análise anterior concluiu que o backend estava quase 100% pronto. Com os requisitos detalhados, **há mudanças significativas necessárias no backend também**:

### Diferenças entre o código atual e os requisitos reais

| Requisito | Estado atual no código | O que precisa mudar |
|---|---|---|
| **Resposta esperada** obrigatória para discursivas | ❌ Não existe o campo | Adicionar `expected_answer` no model `Question` |
| Nota de 0 a 1 (float) na correção | `is_correct` é `BooleanField` | Adicionar campo `score` (`FloatField`) no model `Answer` |
| Professor confirma correção antes do aluno ver | ❌ Não existe controle | Adicionar `correction_confirmed` no model `AssignmentStudent` |
| Professor pode editar a nota da IA | Não há endpoint para isso | Criar endpoint de edição de nota/confirmação |
| Professor pode reprocessar correção | ❌ Não implementado | Criar action no endpoint + gastar dracmas |
| Tipo de exercício (objetiva/discursiva/mista) na geração IA | Prompt v3 sempre gera misto | Criar prompts separados ou parametrizar |
| Criação manual de questão sem alternativas = discursiva | Frontend obriga ≥2 alternativas | Remover validação e tratar no backend |
| Tela do professor ver respostas dos alunos por questão | Não existe | Criar nova view/serializer + componentes |
| Migrar para Gemini API | Projeto usa OpenAI gpt-4o-mini | A especificação menciona Gemini; decidir se migra ou mantém |

---

## Open Questions

> [!IMPORTANT]
> **Sobre a API de IA**: A especificação menciona "API do Gemini", mas o sistema atual usa 100% OpenAI (`gpt-4o-mini`). Vocês devem **migrar para Gemini**, **manter OpenAI**, ou **suportar ambos**? Isso impacta diretamente o serviço em `backend/core/services/openai/`.

> [!IMPORTANT]
> **Sobre o campo `score` vs `is_correct`**: O requisito diz "valor entre 0 e 1" para cada questão discursiva. O campo atual `is_correct` é booleano. A sugestão é adicionar um novo campo `score` (`FloatField`) sem remover `is_correct`, para manter compatibilidade com questões objetivas. Concordam?

---

## Divisão de Trabalho

A divisão é por **funcionalidade completa** (full-stack: backend + frontend), não por camada:

- **👤 Pessoa A** → Funcionalidade 1: Geração de Exercícios Discursivos
- **👤 Pessoa B** → Funcionalidade 2: Pré-Correção com IA

---

## 👤 Pessoa A — Geração de Exercícios com Questões Discursivas

### Fase 1: Alterações no Backend (Models + Migrations)

#### [MODIFY] [models.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/models.py)

Adicionar campo `expected_answer` ao model `Question`:

```diff
 class Question(models.Model):
     class QuestionChoices(models.TextChoices):
         multiple_choice = "MC", "Multiple Choices"
         subjetive = "S", "Subjective"

     exercise = models.ForeignKey(to=Exercise, related_name="questions", on_delete=models.CASCADE)
     description = models.CharField(null=False, blank=False, max_length=500)
     question_type = models.CharField(max_length=2, choices=QuestionChoices.choices, null=False)
+    expected_answer = models.TextField(null=True, blank=True)
+    # Obrigatório para questões discursivas. A IA usará como base na correção.
```

> Após editar, rodar: `python manage.py makemigrations` e `python manage.py migrate`

---

#### [MODIFY] [serializers.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/serializers.py)

Atualizar `QuestionSerializer` para incluir `expected_answer` e `question_type`:

```diff
 class QuestionSerializer(serializers.ModelSerializer):
     alternatives = AlternativeSerializer(many=True, required=False)

     class Meta:
         model = models.Question
-        fields = "__all__"
+        fields = "__all__"  # já pega tudo, mas garantir que question_type e expected_answer estejam expostos
         read_only_fields = ("id", "exercise")

     def create(self, validated_data):
         alternatives_data = validated_data.pop("alternatives", [])
         question = models.Question.objects.create(**validated_data)
         for alternative_data in alternatives_data:
             models.Alternative.objects.create(question=question, **alternative_data)
         return question
+
+    def validate(self, data):
+        """Se question_type for 'S' (subjective), expected_answer é obrigatório."""
+        qt = data.get("question_type")
+        ea = data.get("expected_answer")
+        if qt == models.Question.QuestionChoices.subjetive and not ea:
+            raise serializers.ValidationError(
+                {"expected_answer": "Resposta esperada é obrigatória para questões discursivas."}
+            )
+        return data
```

---

### Fase 2: Adaptar Geração Assistida (IA)

#### [MODIFY] [prompts.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/prompts.py)

Criar variações do prompt ou parametrizar para aceitar o tipo desejado pelo professor:
- `EXERCISE_GENERATOR_OBJECTIVE` — Gera apenas questões de múltipla escolha
- `EXERCISE_GENERATOR_DISCURSIVE` — Gera apenas questões discursivas (**com resposta esperada**)
- `EXERCISE_GENERATOR_MIXED` — Gera ambos os tipos (já é o `EXERCISE_GENERATOR_V3` atual, mas precisa também gerar `expected_answer`)

> [!IMPORTANT]
> O prompt atual **não pede** para a IA gerar uma resposta esperada para as questões discursivas. Isso precisa ser adicionado para que o campo `expected_answer` seja preenchido automaticamente.

#### [MODIFY] [schema.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/schema.py)

```diff
 class SubjectiveQuestionV2(BaseModel):
-    question_type: Literal["subjetcive"]  # TYPO: corrigir
+    question_type: Literal["subjective"]
     description: str
+    expected_answer: str  # Resposta modelo gerada pela IA
```

#### [MODIFY] [openai.py (services)](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/openai.py)

Parametrizar `generate_exercise_v2` para receber o `exercise_type` (`"objective"`, `"discursive"`, `"mixed"`) e escolher o prompt correto.

#### [MODIFY] [tasks.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/tasks.py)

Atualizar `generate_exercises_with_ai_v2` para:
1. Receber o parâmetro `exercise_type`
2. Salvar `expected_answer` para questões subjetivas
3. Salvar `question_type` corretamente

#### [MODIFY] [exercise_view.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/views/exercise_view.py)

Atualizar `GenerateExerciseSerializer` para aceitar campo `exercise_type` (choices: `objective`, `discursive`, `mixed`). Atualizar `generate_exercise_v2` view para passar esse parâmetro à task.

---

### Fase 3: Frontend — Criação Manual de Exercício Discursivo

#### [MODIFY] [Question.ts](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/types/Question.ts)

```diff
 export interface Question {
     id?: number;
     description: string;
     alternatives: Alternative[];
+    question_type?: 'MC' | 'S';
+    expected_answer?: string;
 }
```

#### [MODIFY] [AddStaticExercise.tsx](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/exercises/static/add/AddStaticExercise.tsx)

Mudanças necessárias:
- **Remover a validação** que obriga ≥2 alternativas e 1 correta. Se não houver alternativas, a questão é discursiva.
- **Adicionar um `<textarea>`** para "Resposta Esperada" que aparece quando a questão não tem alternativas (ou quando o professor marca "Discursiva").
- A validação passa a ser: **se discursiva, `expected_answer` é obrigatório**.

#### [MODIFY] [SubmitButtons.tsx](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/exercises/static/add/SubmitButtons.tsx)

Remover `isDisabled={alternatives.length < 2 || ...}` ou torná-lo condicional ao tipo da questão.

---

### Fase 4: Frontend — Geração Assistida (com IA)

#### [MODIFY] [AddGeneratedExercise.tsx](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/exercises/generate/add/AddGeneratedExercise.tsx)

Adicionar um seletor com 3 opções:
- "Questões Objetivas"
- "Questões Discursivas"
- "Misto (Objetivas + Discursivas)"

Passar essa seleção no `onSubmit` e no body da API.

#### [MODIFY] [exercise.tsx (service)](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/utils/axios/service/exercise.tsx)

```diff
 export interface GeneratedExerciseBody {
     subject: number | null;
     isTest: boolean;
     name: string;
     ed_mats: number[];
+    exercise_type: 'objective' | 'discursive' | 'mixed';
 }
```

Alterar `createGenerated` para chamar o endpoint **v2** (`/exercises/generate_exercise_v2/`).

---

### Fase 5: Garantir que IA-generated não fica visível automaticamente

O exercício gerado por IA já é criado com `origin="GI"`. O que falta é:
- Garantir que o professor precisa **explicitamente criar um Assignment** para que os alunos vejam o exercício. Verificar se a listagem de exercícios para alunos já filtra isso (pelo fluxo atual, alunos veem apenas Assignments, não Exercises diretamente — ✅ já funciona assim).

---

## 👤 Pessoa B — Pré-Correção com IA

### Fase 1: Alterações no Backend (Models + Migrations)

#### [MODIFY] [models.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/models.py)

```diff
 class Answer(models.Model):
     assignment_student = models.ForeignKey(to=AssignmentStudent, on_delete=models.CASCADE)
     alternative = models.ForeignKey(to=Alternative, on_delete=models.CASCADE, null=True)
     question = models.ForeignKey(to=Question, on_delete=models.CASCADE)
     response = models.CharField(null=True, blank=True)
     is_correct = models.BooleanField(null=True)
+    score = models.FloatField(null=True, blank=True)
+    # Nota de 0 a 1 atribuída pela IA (ou editada pelo professor)
     explanation = models.CharField(null=True)
     additional_comments = models.CharField(null=True)

 class AssignmentStudent(models.Model):
     grade = models.FloatField(null=True)
     correct_answers = models.IntegerField(null=True)
     answered_date = models.DateTimeField(auto_now_add=True)
     student = models.ForeignKey(to=Student, on_delete=models.CASCADE)
     assignment = models.ForeignKey(to=Assignment, on_delete=models.CASCADE)
+    correction_confirmed = models.BooleanField(default=False)
+    # A correção da IA só fica visível para o aluno quando o professor confirma
```

> Rodar `makemigrations` + `migrate` após a edição.

---

### Fase 2: Adaptar Correção com IA

#### [MODIFY] [prompts.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/prompts.py)

Atualizar o prompt `GRADER` para:
1. Receber a **resposta esperada** (do campo `expected_answer` da questão) como contexto
2. Atribuir uma **nota de 0 a 1** (float) em vez de apenas "Correta/Errada"

Atualizar `GRADER_FORMATTER` para o novo formato JSON:
```json
{
  "correction": {
    "score": 0.75,
    "explanation": "...",
    "additional_comments": "..."
  }
}
```

#### [MODIFY] [schema.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/schema.py)

```diff
 class Correction(BaseModel):
-    is_correct: bool
+    score: float  # Valor entre 0 e 1
     explanation: str
     additional_comments: str
```

#### [MODIFY] [openai.py (services)](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/services/openai/openai.py)

Atualizar `generate_correction` para incluir a `expected_answer` no conteúdo enviado à IA:
```python
content = f"""
**Pergunta:**
{answer.question}

**Resposta Esperada:**
{answer.expected_answer}

**Resposta do Usuário:**
{answer.response}
"""
```

#### [MODIFY] [tasks.py](file:///c:/Users/Andr%C3%A9/praticas-athenis2/backend/core/tasks.py)

Atualizar `correct_answer` para:
1. Passar `expected_answer` para a IA
2. Salvar `score` (float 0-1) em vez de apenas `is_correct`
3. **NÃO** marcar `correction_confirmed = True` (professor faz isso manualmente)
4. Calcular a nota proporcional usando os scores

---

### Fase 3: Novos Endpoints no Backend

#### [NEW] Nova view ou actions em `assignment_student_view.py`

Criar novos endpoints para o fluxo do professor:

1. **`GET /assignment/{id}/student-answers/`** — Lista as respostas de cada aluno para um exercício, indicando quais questões discursivas ainda não foram corrigidas
2. **`POST /assignment-student/{id}/correct-with-ai/`** — Aciona a correção da IA (enfileira no Celery). Gasta dracmas.
3. **`PATCH /assignment-student/{id}/answers/{answer_id}/`** — Professor edita a nota (`score`) de uma resposta específica
4. **`POST /assignment-student/{id}/confirm-correction/`** — Professor confirma a correção final (seta `correction_confirmed = True`). A partir daqui o aluno pode ver.
5. **`POST /assignment-student/{id}/reprocess-correction/`** — Reprocessa a correção com IA (gasta dracmas novamente)

#### [MODIFY] Views/Serializers existentes

Garantir que as views que retornam resultados para o aluno **filtrem** `correction_confirmed = True`. O aluno só deve ver nota/feedback após confirmação do professor.

---

### Fase 4: Frontend — Tela de Respostas dos Alunos (Professor)

#### [NEW] `frontend/src/features/assignment/view/StudentAnswers.tsx`

Nova tela acessada pelo professor dentro de uma turma:
- Lista todos os alunos que responderam
- Para cada aluno, mostra as questões e respostas
- **Destaque visual** (badge/ícone vermelho) em exercícios com questões discursivas pendentes de correção
- Botão **"Corrigir com IA"** que abre modal de confirmação
- Após correção, exibe para cada questão discursiva: `score`, `explanation`, `additional_comments`
- Professor pode **editar o score** (slider ou input numérico de 0 a 1)
- Botões: **"Confirmar Correção"** | **"Reprocessar"** (com aviso de gasto de dracmas)

#### [NEW] `frontend/src/utils/axios/service/correction.tsx`

Novo serviço com os métodos:
```typescript
class CorrectionService {
    static async getStudentAnswers(assignmentId: number): Promise<...>
    static async correctWithAI(assignmentStudentId: number): Promise<...>
    static async updateScore(assignmentStudentId: number, answerId: number, score: number): Promise<...>
    static async confirmCorrection(assignmentStudentId: number): Promise<...>
    static async reprocessCorrection(assignmentStudentId: number): Promise<...>
}
```

#### [NEW] `frontend/src/app/assignment/view/answers/[id]/page.tsx`

Nova página/rota para o professor acessar a tela de respostas.

---

### Fase 5: Frontend — Resolução pelo Aluno (questões discursivas)

#### [MODIFY] [DoExercise.tsx](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/assignment/do/DoExercise.tsx)

Verificar `question_type` de cada questão:
- Se `MC` → renderiza radio buttons (como está hoje)
- Se `S` → renderiza `<textarea>` para resposta em texto

#### [MODIFY] [DoAssignment.tsx](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/assignment/do/DoAssignment.tsx)

Coletar respostas discursivas em uma estrutura separada e incluir no body:
```typescript
interface AssignmentStudentBody {
    alternatives: number[];
    answers: { question: number; response: string }[];
    assignment: number;
}
```

#### [MODIFY] [assignment.tsx (service)](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/utils/axios/service/assignment.tsx)

Atualizar `AssignmentStudentBody` para incluir `answers`.

#### [MODIFY] [ResultAssignmentForStudent.tsx](file:///c:/Users/Andr%C3%A9/praticas-athenis2/frontend/src/features/assignment/view/ResultAssignmentForStudent.tsx)

- Exibir feedback da IA **apenas se `correction_confirmed === true`**
- Mostrar `score`, `explanation` e `additional_comments` por questão discursiva

---

## Ordem de Execução Sugerida

### Pessoa A (Geração)
```
1. [Backend] Adicionar expected_answer no model Question + migration
2. [Backend] Atualizar serializers + validação
3. [Backend] Criar/adaptar prompts por tipo (objective/discursive/mixed) + schema
4. [Backend] Atualizar task e view da geração v2
5. [Frontend] Atualizar tipos TypeScript (Question)
6. [Frontend] Adaptar tela de criação manual (permitir sem alternativas)
7. [Frontend] Adaptar tela de geração assistida (seletor de tipo)
8. [Frontend] Atualizar serviço API do exercício
9. Testes end-to-end
```

### Pessoa B (Pré-Correção)
```
1. [Backend] Adicionar score no Answer + correction_confirmed no AssignmentStudent + migration
2. [Backend] Atualizar prompts/schema de correção (0-1 ao invés de bool)
3. [Backend] Atualizar task correct_answer + função generate_correction
4. [Backend] Criar novos endpoints (student-answers, correct-with-ai, confirm, reprocess)
5. [Frontend] Criar serviço CorrectionService
6. [Frontend] Criar tela de respostas dos alunos (professor)
7. [Frontend] Adaptar DoExercise + DoAssignment para questões discursivas
8. [Frontend] Adaptar ResultAssignmentForStudent (exibir feedback somente se confirmado)
9. Testes end-to-end
```

> [!TIP]
> **Dependência crítica**: Pessoa B precisa que Pessoa A faça o passo 1 (campo `expected_answer`) primeiro, pois a correção da IA usa esse campo. Recomendação: **Pessoa A começa pelo backend (model + migration)** e faz um commit/push logo para que Pessoa B possa usar o campo.

---

## Verificação

### Testes Manuais
1. Professor cria exercício manual com questão discursiva (sem alternativas) + resposta esperada → Exercício salvo corretamente
2. Professor gera exercício assistido tipo "discursivo" → IA retorna questões com expected_answer
3. Professor gera exercício assistido tipo "misto" → IA retorna mix de objetivas e discursivas
4. Aluno responde exercício misto (objetivas + textarea para discursivas) → Submissão funciona
5. Professor vê tela de respostas → Discursivas pendentes em destaque
6. Professor clica "Corrigir com IA" → Modal de confirmação → Correção executada assincronamente → Notificação
7. Professor vê score 0-1, explanation, comments por questão → Edita score → Confirma
8. Aluno vê resultado **somente** após confirmação do professor
9. Professor reprocessa → Dracmas gastas novamente → Nova correção gerada
