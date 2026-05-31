import os
import json
from pathlib import Path

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

CONTRACT_TEMPLATES = {
    "en": """
WORLD CUP 2026 PEER-TO-PEER HOSTING AGREEMENT
--------------------------------------------------
This agreement is made for cultural exchange and short-term hosting during the 2026 FIFA World Cup.

PARTIES:
- Host: {host_name}
- Fan/Guest: {fan_name}

STAY DETAILS:
- Property Address: {address}, {city}, {state}
- Check-in Date: {check_in}
- Check-out Date: {check_out}
- Maximum Guest Capacity: {guests} guests

FINANCIAL ARRANGEMENT:
- Price per Night: ${price_per_night} USD
- Total Booking Cost: ${total_price} USD
- Payments are handled directly between the Host and the Fan.

HOUSE RULES:
{house_rules}

CANCELLATION POLICY:
Standard World Cup Window: Cancellation up to 7 days before check-in yields a full refund. Less than 7 days incurs a 50% booking fee to protect hosts during high-demand dates.

LIABILITY & COMPLIANCE:
This agreement is a peer-to-peer hospitality arrangement and is not a formal residential lease. The parties agree to respect local regulations, maintain clean spaces, and celebrate matches in a respectful, safe manner.

Signed digitally,
{host_name} (Host)  &  {fan_name} (Guest)
Date: {sign_date}
""",
    "es": """
ACUERDO DE ALOJAMIENTO P2P COPA MUNDIAL 2026
--------------------------------------------------
Este acuerdo se celebra con fines de intercambio cultural y alojamiento temporal durante la Copa Mundial de la FIFA 2026.

PARTES:
- Anfitrión: {host_name}
- Huésped/Aficionado: {fan_name}

DETALLES DE LA ESTADÍA:
- Dirección de la propiedad: {address}, {city}, {state}
- Fecha de entrada: {check_in}
- Fecha de salida: {check_out}
- Capacidad máxima de huéspedes: {guests} personas

ACUERDO FINANCIERO:
- Precio por noche: ${price_per_night} USD
- Costo total de la reserva: ${total_price} USD
- Los pagos se gestionan directamente entre el Anfitrión y el Huésped.

REGLAS DE LA CASA:
{house_rules}

POLÍTICA DE CANCELACIÓN:
Período de Mundial: Cancelación hasta 7 días antes de la llegada tiene un reembolso completo. Menos de 7 días incurre en un cargo del 50% para proteger al anfitrión durante fechas de alta demanda.

RESPONSABILIDAD Y CUMPLIMIENTO:
Este acuerdo es un arreglo de hospitalidad entre pares y no constituye un contrato de arrendamiento formal. Las partes se comprometen a respetar las normas locales, mantener el orden y celebrar los partidos de forma respetuosa y segura.

Firmado digitalmente,
{host_name} (Anfitrión)  y  {fan_name} (Huésped)
Fecha: {sign_date}
""",
    "pt": """
ACORDO DE HOSPEDAGEM P2P COPA DO MUNDO 2026
--------------------------------------------------
Este acordo é feito para intercâmbio cultural e hospedagem de curto prazo durante a Copa do Mundo FIFA 2026.

PARTES:
- Anfitrião(ã): {host_name}
- Hóspede/Torcedor(a): {fan_name}

DETALHES DA ESTADIA:
- Endereço da propriedade: {address}, {city}, {state}
- Data de entrada (Check-in): {check_in}
- Data de saída (Check-out): {check_out}
- Capacidade máxima de hóspedes: {guests} pessoas

ACORDO FINANCEIRO:
- Preço por noite: ${price_per_night} USD
- Custo total da reserva: ${total_price} USD
- Os pagamentos são tratados diretamente entre o Anfitrião e o Torcedor.

REGRAS DA CASA:
{house_rules}

POLÍTICA DE CANCELAMENTO:
Janela Especial da Copa do Mundo: Cancelamento até 7 dias antes do check-in confere reembolso total. Menos de 7 dias antes do check-in incorre em taxa de 50% para proteger os anfitriões durante datas de alta demanda.

RESPONSABILIDADE E CONFORMIDADE:
Este acordo é um arranjo de hospitalidade p2p e não é um contrato de aluguel formal. As partes concordam em respeitar as regras locais, manter o espaço limpo e celebrar os jogos de maneira segura e amigável.

Assinado digitalmente,
{host_name} (Anfitrião)  e  {fan_name} (Hóspede)
Data: {sign_date}
""",
    "fr": """
ACCORD D'HÉBERGEMENT DE PARTICULIER À PARTICULIER COUPE DU MONDE 2026
--------------------------------------------------
Cet accord est établi dans le cadre d'un échange culturel et d'un hébergement temporaire pendant la Coupe du Monde de la FIFA 2026.

PARTIES:
- Hôte: {host_name}
- Supporter/Voyageur: {fan_name}

DÉTAILS DU SÉJOUR:
- Adresse du logement: {address}, {city}, {state}
- Date d'arrivée: {check_in}
- Date de départ: {check_out}
- Nombre maximum d'invités: {guests} personnes

ACCORD FINANCIER:
- Prix par nuit: ${price_per_night} USD
- Coût total de la réservation: ${total_price} USD
- Les paiements sont réglés directement entre l'Hôte et le Supporter.

RÈGLES DE LA MAISON:
{house_rules}

CONDITIONS D'ANNULATION:
Période Coupe du Monde: Annulation gratuite jusqu'à 7 jours avant l'arrivée. Une annulation à moins de 7 jours entraîne des frais de 50% afin de protéger l'hôte en cette période de forte demande.

RESPONSABILITÉ:
Cet accord constitue un arrangement d'hospitalité temporaire et non un bail résidentiel formel. Les parties s'engagent à respecter le voisinage, maintenir la propreté et célébrer les matchs de manière cordiale.

Signé numériquement,
{host_name} (Hôte)  &  {fan_name} (Supporter)
Date: {sign_date}
""",
    "ar": """
اتفاقية استضافة وتسكين كأس العالم ٢٠٢٦
--------------------------------------------------
تم إبرام هذه الاتفاقية لأغراض التبادل الثقافي والاستضافة قصيرة المدى خلال بطولة كأس العالم لكرة القدم ٢٠٢٦.

الأطراف:
- المضيف: {host_name}
- المشجع / الضيف: {fan_name}

تفاصيل الإقامة:
- عنوان العقار: {address}, {city}, {state}
- تاريخ الوصول: {check_in}
- تاريخ المغادرة: {check_out}
- الحد الأقصى للضيوف: {guests} أشخاص

الترتيب المالي:
- السعر لليلة الواحدة: ${price_per_night} دولار أمريكي
- التكلفة الإجمالية للحجز: ${total_price} دولار أمريكي
- يتم تسوية الدفعات مباشرة بين المضيف والمشجع.

شروط المنزل:
{house_rules}

سياسة الإلغاء:
نافذة كأس العالم الخاصة: الإلغاء قبل ٧ أيام من تاريخ الوصول يتيح استرداد كامل المبلغ. الإلغاء في أقل من ٧ أيام يترتب عليه دفع ٥٠٪ من قيمة الحجز لحماية المضيفين.

المسؤولية والقوانين:
هذه الاتفاقية هي ترتيب ضيافة بين أفراد ولا تعتبر عقد إيجار سكني رسمي. يلتزم الطرفان باحترام القوانين المحلية والحفاظ على نظافة المكان والاحتفال بالبطولة بشكل مسؤول وآمن.

تم التوقيع رقمياً،
{host_name} (المضيف)  و  {fan_name} (الضيف)
التاريخ: {sign_date}
"""
}

def generate_contract(host_name, fan_name, address, city, state, check_in, check_out, price_per_night, total_price, house_rules, guests=2, language="en"):
    """
    Generate a plain-language contract between the host and fan in the selected language.
    """
    lang = language.lower()[:2] if language else "en"
    if lang not in CONTRACT_TEMPLATES:
        lang = "en"
        
    sign_date = datetime.now().strftime("%Y-%m-%d")
    
    # Check if Gemini key is available for generating dynamic contract
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            Write a plain-language housing micro-contract for the 2026 World Cup in {language} language based on these details:
            - Host Name: {host_name}
            - Fan Name: {fan_name}
            - Property Address: {address}, {city}, {state}
            - Dates: Check-in {check_in}, Check-out {check_out}
            - Capacity: {guests} guests
            - Price: ${price_per_night} USD/night, Total Booking: ${total_price} USD
            - House Rules: {house_rules}
            - Cancellation Policy: Cancel up to 7 days before check-in for full refund. Less than 7 days, 50% penalty to protect the host.
            
            Make it friendly, clear, easy to read, and avoid complex legal jargon. Output ONLY the contract text.
            """
            
            response = model.generate_content(prompt)
            if response.text:
                return response.text.strip()
        except Exception as e:
            print(f"Gemini Contract Generation failed: {e}. Falling back to template.")

    # Local fallback template formatting
    template = CONTRACT_TEMPLATES[lang]
    return template.format(
        host_name=host_name,
        fan_name=fan_name,
        address=address,
        city=city,
        state=state,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        price_per_night=price_per_night,
        total_price=total_price,
        house_rules=house_rules,
        sign_date=sign_date
    ).strip()
