## Plano: Assistente IA no TL-BLU

### 1. Chat de Texto (Lovable AI)
- Criar edge function `chat` que usa Lovable AI Gateway
- Criar componente de chat flutuante (botão no canto inferior)
- IA conhece o sistema e pode orientar sobre operações
- Streaming de respostas em tempo real

### 2. Voz (ElevenLabs)
- Criar edge function `elevenlabs-tts` para converter respostas em áudio
- Botão de ouvir resposta no chat
- Necessário: chave API do ElevenLabs (será solicitada)

### 3. Acesso
- Disponível para todos os perfis de usuário
- Ícone flutuante no canto inferior direito da tela

### Etapas:
1. Criar edge function de chat com Lovable AI
2. Criar componente de chat flutuante
3. Solicitar chave ElevenLabs para voz
4. Criar edge function de TTS
5. Integrar botão de ouvir no chat